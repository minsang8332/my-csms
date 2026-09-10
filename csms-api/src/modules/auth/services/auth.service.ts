import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        password: hashedPassword,
        name: signupDto.name,
        group: signupDto.group,
      },
    });

    return { id: user.id, email: user.email, name: user.name, group: user.group };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      });

      const authRecord = await this.prisma.auth.findFirst({
        where: { userId: payload.sub, refreshToken },
      });

      if (!authRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if expired in DB (just to be extra safe, though verify() handles it)
      if (authRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt) throw new UnauthorizedException('User not found or deleted');

      return this.generateTokens(user.id, user.email);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async withdraw(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    
    // Optionally delete or invalidate all auth records
    await this.prisma.auth.deleteMany({
      where: { userId },
    });

    return { message: 'Withdrawal successful' };
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, group: true }
    });
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'fallback_secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      expiresIn: '7d',
    });

    // Save refresh token to database
    await this.prisma.auth.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
