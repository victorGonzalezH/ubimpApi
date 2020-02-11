import { Module } from '@nestjs/common';
import { RealTimeGateway } from './gateways/real-time.gateway';
import {Logger} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  providers: [Logger, RealTimeGateway],

  imports: [
    ScheduleModule.forRoot(),
  ],
})
export class UbimpApiModule {}
