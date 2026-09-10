import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Item } from '@prisma/client';
import { randomUUID } from 'crypto';


@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Item[]> {
    return this.prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async create(itemData: Partial<Item>): Promise<Item> {
    const item = await this.prisma.item.create({
      data: {
        id: itemData.id || randomUUID(),
        name: itemData.name!,
        price: itemData.price!,
        count: itemData.count!,
      },
    });
    return item;
  }

  async update(id: string, itemData: Partial<Item>): Promise<Item> {
    await this.findOne(id);
    return this.prisma.item.update({
      where: { id },
      data: {
        name: itemData.name,
        price: itemData.price,
        count: itemData.count,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.item.delete({
      where: { id },
    });
  }
}
