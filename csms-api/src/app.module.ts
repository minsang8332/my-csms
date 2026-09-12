import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "@/prisma/prisma.module";
import { HealthModule } from "@/modules/health/health.module";
import { ItemsModule } from "@/modules/items/items.module";
import { CsModule } from "@/modules/cs/cs.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { StorageModule } from "@/storage/storage.module";

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
})
export class AppModule {}
