import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/auth.dto';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user || user.deletedAt || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user.id, user.email, user.authVersion);
  }

  async refreshToken(refreshToken: string) {
    const refreshSecret = this.getRefreshSecret();
    try {
      const payload = this.jwtService.verify<{ sub: string; ver: number }>(refreshToken, {
        secret: refreshSecret,
      });
      const session = await this.prisma.auth.findFirst({
        where: { userId: payload.sub, tokenHash: this.hashToken(refreshToken) },
      });
      if (!session || session.expiresAt <= new Date()) throw new UnauthorizedException('Invalid refresh token');
      if (session.revokedAt) {
        // A previously rotated token was replayed. Invalidate its token family and all access tokens.
        if (session.familyId) {
          await this.prisma.auth.updateMany({
            where: { userId: payload.sub, familyId: session.familyId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        await this.prisma.user.update({ where: { id: payload.sub }, data: { authVersion: { increment: 1 } } });
        throw new UnauthorizedException('Refresh token reuse detected');
      }
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt || user.authVersion !== payload.ver) throw new UnauthorizedException('Token is no longer valid');

      await this.prisma.auth.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      return this.generateTokens(user.id, user.email, user.authVersion, session.familyId ?? randomUUID(), session.id);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async withdraw(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), authVersion: { increment: 1 } },
    });
    await this.prisma.auth.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { message: 'Withdrawal successful' };
  }

  async disableUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), authVersion: { increment: 1 } },
    });
    await this.prisma.auth.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { message: 'User disabled' };
  }

  async assignRoles(userId: string, roleCodes: string[], actorRoleCodes: string[]) {
    const uniqueCodes = [...new Set(roleCodes)];
    if (uniqueCodes.includes('SUPER_ADMIN') && !actorRoleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign SUPER_ADMIN');
    }
    const roles = await this.prisma.role.findMany({ where: { code: { in: uniqueCodes } } });
    if (roles.length !== uniqueCodes.length) throw new BadRequestException('Unknown role included');

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({ data: roles.map((role) => ({ userId, roleId: role.id })) }),
      this.prisma.user.update({ where: { id: userId }, data: { authVersion: { increment: 1 } } }),
    ]);
    return { message: 'Roles updated', roleCodes: uniqueCodes };
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        group: true,
        email: true,
        roles: { select: { role: { select: { code: true } } } },
      },
    });
  }

  private async generateTokens(userId: string, email: string, authVersion: number, familyId: string = randomUUID(), parentSessionId?: string) {
    const payload = { sub: userId, email, ver: authVersion };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getAccessSecret(),
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: '7d',
    });

    await this.prisma.auth.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        familyId,
        parentSessionId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private getAccessSecret() {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
    return process.env.JWT_SECRET;
  }

  private getRefreshSecret() {
    if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is required');
    return process.env.JWT_REFRESH_SECRET;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
