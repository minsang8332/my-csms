import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { HealthModule } from '@/modules/health/health.module';
import { ItemsModule } from '@/modules/items/items.module';
import { CsModule } from '@/modules/cs/cs.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DailyVoteModule } from '@/modules/daily-vote/daily-vote.module';
import { BackupModule } from '@/modules/backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    ItemsModule,
    CsModule,
    AuthModule,
    DailyVoteModule,
    BackupModule,
  ],
})
export class AppModule {}


