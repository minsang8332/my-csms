import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CsService } from '@/modules/cs/services/cs.service';
import { Cs } from '@prisma/client';
import * as fs from 'fs';

@Controller('cs')
export class CsController {
  constructor(private readonly csService: CsService) {}

  @Get('statuses')
  getStatuses(): string[] {
    return ['문의접수', '입고요청', '처리중', '출고대기', '출고완료', '접수취소'];
  }

  @Get()
  findAll(): Promise<Cs[]> {
    return this.csService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Cs> {
    return this.csService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Cs>): Promise<Cs> {
    try {
      fs.appendFileSync('/usr/src/app/debug.log', `CREATE BODY: ${JSON.stringify(data)}\n`);
    } catch (e) {}
    console.log('CS CREATE BODY:', data);
    return this.csService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<Cs>,
  ): Promise<Cs> {
    try {
      fs.appendFileSync('/usr/src/app/debug.log', `UPDATE BODY: ${JSON.stringify(data)}\n`);
    } catch (e) {}
    console.log('CS UPDATE BODY:', data);
    return this.csService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.csService.remove(id);
  }

  @Post(':id/replies')
  createReply(
    @Param('id') csId: string,
    @Body() data: { content: string },
  ) {
    return this.csService.createReply(csId, data.content);
  }

  @Put('replies/:replyId')
  updateReply(
    @Param('replyId') replyId: string,
    @Body() data: { content: string },
  ) {
    return this.csService.updateReply(replyId, data.content);
  }

  @Delete('replies/:replyId')
  deleteReply(@Param('replyId') replyId: string) {
    return this.csService.deleteReply(replyId);
  }
}
