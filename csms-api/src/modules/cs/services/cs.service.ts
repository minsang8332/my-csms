import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Cs, ShippedItem, CsReply } from '@prisma/client';

import { randomUUID } from 'crypto';

@Injectable()
export class CsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<(Cs & { items: ShippedItem[]; replies: any[] })[]> {
    return this.prisma.cs.findMany({
      include: {
        items: true,
        replies: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Cs & { items: ShippedItem[]; replies: any[] }> {
    const branch = await this.prisma.cs.findUnique({
      where: { id },
      include: {
        items: true,
        replies: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });
    if (!branch) {
      throw new NotFoundException(`Cs with ID ${id} not found`);
    }
    return branch;
  }

  async create(data: Partial<Cs & { items: any[] }>): Promise<Cs> {
    return this.prisma.$transaction(async (tx) => {
      const branchId = data.id || randomUUID();

      const cs = await tx.cs.create({
        data: {
          id: branchId,
          name: data.name!,
          address: data.address || '',
          contact: data.contact || '',
          status: data.status || '문의접수',
          licensePath: data.licensePath,
          licenseName: data.licenseName,
          description: data.description || '',
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
          shippedAt: data.shippedAt ? new Date(data.shippedAt) : null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        },
      });

      const inputItems = data.items || [];
      for (const input of inputItems) {
        // Find stock item and deduct
        const item = await tx.item.findUnique({ where: { name: input.name } });
        if (item) {
          await tx.item.update({
            where: { id: item.id },
            data: { count: item.count - input.count },
          });
        }

        await tx.shippedItem.create({
          data: {
            csId: branchId,
            itemId: item ? item.id : null,
            name: input.name,
            price: input.price,
            count: input.count,
          },
        });
      }

      return tx.cs.findUnique({
        where: { id: branchId },
        include: { items: true },
      }) as any;
    });
  }

  async update(id: string, data: Partial<Cs & { items: any[] }>): Promise<Cs> {
    return this.prisma.$transaction(async (tx) => {
      const oldBranch = await tx.cs.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!oldBranch) {
        throw new NotFoundException(`Cs with ID ${id} not found`);
      }

      // Map existing shipped items
      const oldItemsMap = new Map<string, number>();
      for (const si of oldBranch.items || []) {
        oldItemsMap.set(si.name, (oldItemsMap.get(si.name) || 0) + si.count);
      }

      // Track new items
      const newItems = data.items || [];
      const newItemsMap = new Map<string, number>();
      for (const item of newItems) {
        newItemsMap.set(item.name, (newItemsMap.get(item.name) || 0) + item.count);
      }

      // 1. Calculate diff for new/updated items
      for (const [name, newCount] of newItemsMap.entries()) {
        const oldCount = oldItemsMap.get(name) || 0;
        const diff = oldCount - newCount; // diff > 0 stock returned, diff < 0 stock consumed

        if (diff !== 0) {
          const item = await tx.item.findUnique({ where: { name } });
          if (item) {
            await tx.item.update({
              where: { id: item.id },
              data: { count: item.count + diff },
            });
          }
        }
      }

      // 2. Return stock for deleted items
      for (const [name, oldCount] of oldItemsMap.entries()) {
        if (!newItemsMap.has(name)) {
          const item = await tx.item.findUnique({ where: { name } });
          if (item) {
            await tx.item.update({
              where: { id: item.id },
              data: { count: item.count + oldCount },
            });
          }
        }
      }

      // 3. Clear old ShippedItem records
      await tx.shippedItem.deleteMany({ where: { csId: id } });

      // 4. Update Cs fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.contact !== undefined) updateData.contact = data.contact;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.licensePath !== undefined) updateData.licensePath = data.licensePath;
      if (data.licenseName !== undefined) updateData.licenseName = data.licenseName;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.createdAt !== undefined) {
        updateData.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
      }
      if (data.receivedAt !== undefined) {
        updateData.receivedAt = data.receivedAt ? new Date(data.receivedAt) : null;
      }
      if (data.shippedAt !== undefined) {
        updateData.shippedAt = data.shippedAt ? new Date(data.shippedAt) : null;
      }

      await tx.cs.update({
        where: { id },
        data: updateData,
      });

      // 5. Create new ShippedItem records
      for (const input of newItems) {
        const item = await tx.item.findUnique({ where: { name: input.name } });
        await tx.shippedItem.create({
          data: {
            csId: id,
            itemId: item ? item.id : null,
            name: input.name,
            price: input.price,
            count: input.count,
          },
        });
      }

      return tx.cs.findUnique({
        where: { id },
        include: { items: true },
      }) as any;
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const branch = await tx.cs.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!branch) {
        throw new NotFoundException(`Cs with ID ${id} not found`);
      }

      // Return stock for all shipped items
      for (const si of branch.items || []) {
        const item = await tx.item.findUnique({ where: { name: si.name } });
        if (item) {
          await tx.item.update({
            where: { id: item.id },
            data: { count: item.count + si.count },
          });
        }
      }

      // Cascade delete is handled by database relation cascading (Prisma schema relations onDelete: Cascade)
      await tx.cs.delete({
        where: { id },
      });
    });
  }

  async createReply(csId: string, content: string): Promise<CsReply> {
    return this.prisma.csReply.create({
      data: {
        csId,
        content,
      }
    });
  }

  async updateReply(replyId: string, content: string): Promise<CsReply> {
    return this.prisma.csReply.update({
      where: { id: replyId },
      data: { content }
    });
  }

  async deleteReply(replyId: string): Promise<void> {
    await this.prisma.csReply.delete({
      where: { id: replyId },
    });
  }
}
