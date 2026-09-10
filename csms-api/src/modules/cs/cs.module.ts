import { Module } from '@nestjs/common';
import { CsService } from '@/modules/cs/services/cs.service';
import { CsController } from '@/modules/cs/controllers/cs.controller';

@Module({
  controllers: [CsController],
  providers: [CsService],
})
export class CsModule {}
