import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';

//import { DatabaseConfigService } from './config/databaseConfig.service';

//import { AppConfigService } from './config/appConfig.service';

import { UbimpApplicationModule } from 'uba/ubimp.application';
import { UbimpInfrastructureModule } from '@ubi/ubimp.infrastructure';
import { UbimpDomainModule, Message, Messages } from '@ubd/ubimp.domain';
import { ClientProxyFactory } from '@nestjs/microservices';
import { RealTimeWebSocketGateway } from './gateways/real-time-web-socket.gateway';
import configuration from 'uba/ubimp.application/config/configuration';
import { DatabaseConfigService } from 'uba/ubimp.application/config/databaseConfig.service';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { AuthService } from 'uba/ubimp.application/services/auth/auth.service';
import { JwtService, JwtModule } from '@nestjs/jwt';

// import { AuthService } from 'uba/ubimp.application/services/auth/auth.service';
// import { LocalStrategy } from 'uba/ubimp.application/services/auth/local.strategy';
// import { UserRepositoryService } from '@ubi/ubimp.infrastructure/users/user-repository.service';
// import { JwtService, JwtModule } from '@nestjs/jwt';
import { VerifyController } from './controllers/verify/verify.controller';
import { ActivateController } from './controllers/activate/activate.controller';

@Module({
  providers: [Logger, ConfigService, AppConfigService ],
  imports: [UbimpApplicationModule, UbimpInfrastructureModule, UbimpDomainModule,
            ScheduleModule.forRoot(),
            ConfigModule.forRoot({ load: [configuration] }),
            MongooseModule.forRootAsync({
              imports: [ConfigModule],
              useClass: DatabaseConfigService,
              inject: [ConfigService],
            }) ],
  controllers: [AppController, VerifyController, ActivateController],
})
export class UbimpApiModule {}
