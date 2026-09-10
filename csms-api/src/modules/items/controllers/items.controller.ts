import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ItemsService } from '@/modules/items/services/items.service';
import { Item } from '@prisma/client';


@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(): Promise<Item[]> {
    return this.itemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Item> {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() itemData: Partial<Item>): Promise<Item> {
    return this.itemsService.create(itemData);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() itemData: Partial<Item>,
  ): Promise<Item> {
    return this.itemsService.update(id, itemData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<boolean> {
    try {
      await this.itemsService.remove(id);
      return true;
    } catch {
      return false;
    }
  }
}
