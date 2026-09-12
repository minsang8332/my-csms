import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { isDynamoDb } from '@/storage/storage.config';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from './permissions';

@Injectable()
export class RbacSeedService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // DynamoDB uses its own repository/table bootstrap. Do not call Prisma there.
    if (isDynamoDb()) return;

    await this.seedRolesAndPermissions();
    await this.seedSuperAdmin();
  }

  private async seedRolesAndPermissions() {
    for (const code of ALL_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code },
      });
    }

    for (const [code, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await this.prisma.role.upsert({
        where: { code },
        update: { name: code },
        create: { code, name: code },
      });
      const permissionRecords = await this.prisma.permission.findMany({
        where: { code: { in: permissions } },
        select: { id: true },
      });
      for (const permission of permissionRecords) {
        await this.prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
  }

  private async seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME;
    const group = process.env.SUPER_ADMIN_GROUP ?? '관리자';
    const supplied = [email, password, name].filter(Boolean).length;

    if (supplied === 0) return;
    if (supplied !== 3) {
      throw new Error('SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME must be set together');
    }

    const role = await this.prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } });
    const passwordHash = await bcrypt.hash(password!, 12);
    const user = await this.prisma.user.upsert({
      where: { email: email! },
      update: { password: passwordHash, name: name!, group, deletedAt: null },
      create: {
        email: email!,
        password: passwordHash,
        name: name!,
        group,
      },
    });
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
    this.logger.log(`SUPER_ADMIN role ensured for ${email}`);
  }
}
