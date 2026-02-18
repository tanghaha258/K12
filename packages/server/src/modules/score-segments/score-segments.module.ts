import { Module } from '@nestjs/common';
import { ScoreSegmentsService } from './score-segments.service';
import { ScoreSegmentsController } from './score-segments.controller';

@Module({
  controllers: [ScoreSegmentsController],
  providers: [ScoreSegmentsService],
  exports: [ScoreSegmentsService],
})
export class ScoreSegmentsModule {}
