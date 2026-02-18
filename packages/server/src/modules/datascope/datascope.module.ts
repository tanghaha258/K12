import { Module } from '@nestjs/common';
import { DataScopeController } from './datascope.controller';
import { DataScopeService } from './datascope.service';

@Module({
  controllers: [DataScopeController],
  providers: [DataScopeService],
  exports: [DataScopeService],
})
export class DataScopeModule {}
