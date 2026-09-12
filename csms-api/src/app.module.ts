import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "@/prisma/prisma.module";
import { HealthModule } from "@/modules/health/health.module";
import { ItemsModule } from "@/modules/items/items.module";
import { CsModule } from "@/modules/cs/cs.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { StorageModule } from "@/storage/storage.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/rbac/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
    PrismaModule,
    HealthModule,
    ItemsModule,
    CsModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
