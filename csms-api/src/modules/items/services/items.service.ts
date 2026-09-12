import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Item } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbService } from '@/storage/dynamodb/dynamodb.service';
import { isDynamoDb } from '@/storage/storage.config';


@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamo: DynamoDbService,
  ) {}

  private get tableName() {
    return this.dynamo.table('CSMS_ITEMS_TABLE');
  }

  private asItem(value: Record<string, unknown>): Item {
    return { id: String(value.id), name: String(value.name), price: Number(value.price), count: Number(value.count) } as Item;
  }

  async findAll(): Promise<Item[]> {
    if (isDynamoDb()) {
      const result = await this.dynamo.client.send(new ScanCommand({ TableName: this.tableName }));
      return (result.Items ?? []).map((item) => this.asItem(item)).sort((a, b) => a.name.localeCompare(b.name));
    }
    return this.prisma.item.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Item> {
    if (isDynamoDb()) {
      const result = await this.dynamo.client.send(new GetCommand({ TableName: this.tableName, Key: { id } }));
      if (!result.Item) throw new NotFoundException(`Item with ID ${id} not found`);
      return this.asItem(result.Item);
    }
    const item = await this.prisma.item.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async create(itemData: Partial<Item>): Promise<Item> {
    if (isDynamoDb()) {
      const existing = (await this.findAll()).find((item) => item.name === itemData.name);
      if (existing) throw new ConflictException('Item name already exists');
      const item = { id: itemData.id || randomUUID(), name: itemData.name!, price: itemData.price!, count: itemData.count! } as Item;
      await this.dynamo.client.send(new PutCommand({ TableName: this.tableName, Item: item, ConditionExpression: 'attribute_not_exists(id)' }));
      return item;
    }
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
    if (isDynamoDb()) {
      const current = await this.findOne(id);
      const item = { ...current, ...itemData, id } as Item;
      await this.dynamo.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #name = :name, price = :price, #count = :count',
        ExpressionAttributeNames: { '#name': 'name', '#count': 'count' },
        ExpressionAttributeValues: { ':name': item.name, ':price': item.price, ':count': item.count },
        ConditionExpression: 'attribute_exists(id)',
      }));
      return item;
    }
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
    if (isDynamoDb()) {
      await this.dynamo.client.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)',
      }));
      return;
    }
    await this.findOne(id);
    await this.prisma.item.delete({
      where: { id },
    });
  }
}
