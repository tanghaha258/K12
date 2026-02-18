import { Module } from '@nestjs/common';
import { ScoreLinesService } from './score-lines.service';
import { ScoreLinesController } from './score-lines.controller';

@Module({
  controllers: [ScoreLinesController],
  providers: [ScoreLinesService],
  exports: [ScoreLinesService],
})
export class ScoreLinesModule {}
