import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isDynamoDb } from '@/storage/storage.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (isDynamoDb()) return;
    await this.$connect();
  }

  async onModuleDestroy() {
    if (isDynamoDb()) return;
    await this.$disconnect();
  }
}
