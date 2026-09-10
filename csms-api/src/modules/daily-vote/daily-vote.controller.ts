import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import { DailyVoteService, VoteSubmitDto } from './daily-vote.service';

@Controller('daily-votes')
export class DailyVoteController {
  constructor(private readonly voteService: DailyVoteService) {}

  @Get('status')
  async getStatus() {
    return this.voteService.getStatus();
  }

  @Get('unused')
  async getUnusedUuids(@Query('limit') limit?: number) {
    return this.voteService.getUnusedUuids(limit);
  }

  @Get('check')
  async checkVoteStatus(@Query('uuid') uuid?: string) {
    return this.voteService.checkVoteStatus(uuid);
  }

  @Post('submit')
  async submitVote(
    @Body() dto: VoteSubmitDto,
    @Headers('user-agent') userAgent: string,
    @Req() req: any,
  ) {
    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    return this.voteService.submitVote(
      dto,
      userAgent,
      Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
    );
  }

  @Post('seed')
  async seedUuids(@Body('count') count?: number) {
    return this.voteService.seedUuids(count);
  }

  @Post('assign')
  async assignEmailToUuid(@Body('uuid') uuid: string, @Body('email') email: string) {
    return this.voteService.assignEmailToUuid(uuid, email);
  }
}
