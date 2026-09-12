import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ItemsService } from '@/modules/items/services/items.service';
import { Item } from '@prisma/client';
import { CreateItemDto, UpdateItemDto } from '../dto/item.dto';
import { RequirePermissions } from '@/modules/auth/rbac/permissions.decorator';
import { PERMISSIONS } from '@/modules/auth/rbac/permissions';


@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ITEM_READ)
  findAll(): Promise<Item[]> {
    return this.itemsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ITEM_READ)
  findOne(@Param('id') id: string): Promise<Item> {
    return this.itemsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ITEM_WRITE)
  create(@Body() itemData: CreateItemDto): Promise<Item> {
    return this.itemsService.create(itemData);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ITEM_WRITE)
  update(
    @Param('id') id: string,
    @Body() itemData: UpdateItemDto,
  ): Promise<Item> {
    return this.itemsService.update(id, itemData);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ITEM_DELETE)
  async remove(@Param('id') id: string): Promise<boolean> {
    try {
      await this.itemsService.remove(id);
      return true;
    } catch {
      return false;
    }
  }
}
