import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CsService } from '@/modules/cs/services/cs.service';
import { Cs } from '@prisma/client';
import { RequirePermissions } from '@/modules/auth/rbac/permissions.decorator';
import { PERMISSIONS } from '@/modules/auth/rbac/permissions';

@Controller('cs')
export class CsController {
  constructor(private readonly csService: CsService) {}

  @Get('statuses')
  @RequirePermissions(PERMISSIONS.CS_READ)
  getStatuses(): string[] {
    return ['문의접수', '입고요청', '처리중', '출고대기', '출고완료', '접수취소'];
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CS_READ)
  findAll(): Promise<Cs[]> {
    return this.csService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CS_READ)
  findOne(@Param('id') id: string): Promise<Cs> {
    return this.csService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CS_WRITE)
  create(@Body() data: Partial<Cs>): Promise<Cs> {
    return this.csService.create(data);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.CS_WRITE)
  update(
    @Param('id') id: string,
    @Body() data: Partial<Cs>,
  ): Promise<Cs> {
    return this.csService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CS_DELETE)
  remove(@Param('id') id: string): Promise<void> {
    return this.csService.remove(id);
  }

  @Post(':id/replies')
  @RequirePermissions(PERMISSIONS.CS_REPLY)
  createReply(
    @Param('id') csId: string,
    @Body() data: { content: string },
  ) {
    return this.csService.createReply(csId, data.content);
  }

  @Put('replies/:replyId')
  @RequirePermissions(PERMISSIONS.CS_REPLY)
  updateReply(
    @Param('replyId') replyId: string,
    @Body() data: { content: string },
  ) {
    return this.csService.updateReply(replyId, data.content);
  }

  @Delete('replies/:replyId')
  @RequirePermissions(PERMISSIONS.CS_REPLY)
  deleteReply(@Param('replyId') replyId: string) {
    return this.csService.deleteReply(replyId);
  }
}
