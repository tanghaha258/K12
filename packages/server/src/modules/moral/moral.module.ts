import { Module } from '@nestjs/common';
import { MoralController } from './moral.controller';
import { MoralService } from './moral.service';

@Module({
  controllers: [MoralController],
  providers: [MoralService],
})
export class MoralModule {}
