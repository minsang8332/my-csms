import { Module } from '@nestjs/common';
import { DailyVoteController } from './daily-vote.controller';
import { DailyVoteService } from './daily-vote.service';

@Module({
  controllers: [DailyVoteController],
  providers: [DailyVoteService],
  exports: [DailyVoteService],
})
export class DailyVoteModule {}
