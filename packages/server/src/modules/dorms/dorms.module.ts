import { Module } from '@nestjs/common';
import { DormsController } from './dorms.controller';
import { DormsService } from './dorms.service';

@Module({
  controllers: [DormsController],
  providers: [DormsService],
  exports: [DormsService],
})
export class DormsModule {}
