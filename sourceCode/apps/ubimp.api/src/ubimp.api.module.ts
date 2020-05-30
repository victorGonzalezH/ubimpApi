import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RealTimeWebSocketGateway } from './gateways/real-time-web-socket.gateway';
import configuration from './config/configuration';
import { DatabaseConfigService } from './config/databaseConfig.service';
import { AppConfigService } from './config/appConfig.service';

@Module({
  providers: [Logger, AppService, AppConfigService],
  imports: [
            ScheduleModule.forRoot(),
            ConfigModule.forRoot({ load: [configuration] }),
            MongooseModule.forRootAsync({
              imports: [ConfigModule],
              useClass: DatabaseConfigService,
              inject: [ConfigService],
            })],
  controllers: [AppController],
})
export class UbimpApiModule {}
