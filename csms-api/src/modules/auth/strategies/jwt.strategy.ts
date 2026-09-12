import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (!user || user.deletedAt || user.authVersion !== payload.ver) {
      throw new UnauthorizedException('Token is no longer valid');
    }
    const permissions = [...new Set(user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rolePermission) => rolePermission.permission.code),
    ))];
    return { userId: user.id, email: user.email, permissions, roleCodes: user.roles.map((userRole) => userRole.role.code) };
  }
}
