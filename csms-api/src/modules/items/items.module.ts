import { Module } from '@nestjs/common';
import { ItemsService } from '@/modules/items/services/items.service';
import { ItemsController } from '@/modules/items/controllers/items.controller';


@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
