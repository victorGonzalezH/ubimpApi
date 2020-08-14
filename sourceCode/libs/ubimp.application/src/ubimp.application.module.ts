import { Module } from '@nestjs/common';
import { UbimpApplicationService } from './ubimp.application.service';
import { AuthService } from './services/auth/auth.service';
import { LocalStrategy } from './services/auth/local.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UbimpInfrastructureModule, MessageSchema, MessagesSchema } from '@ubi/ubimp.infrastructure';
import { UbimpDomainModule } from '@ubd/ubimp.domain';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ClientProxyFactory } from '@nestjs/microservices';
import { AppConfigService } from './config/appConfig.service';
import { ConfigService } from '@nestjs/config';
import { TemplatesManager } from './services/templates/templatesManager.service';
import { MessagesRepositoryService } from '@ubi/ubimp.infrastructure/persistence/messages.repository.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  providers: [UbimpApplicationService, LocalStrategy, AuthService, AppConfigService, ConfigService,
    {
      provide: 'USERS_SERVICE',
      useFactory: (appConfigService: AppConfigService) => {
      const usersServiceOptions = appConfigService.getUsersServiceConfig();
      return ClientProxyFactory.create(usersServiceOptions);
    },
    inject: [AppConfigService, ConfigService],
  },
  {
    provide: 'INFRASTRUCTURE_SERVICE',
    useFactory: (appConfigService: AppConfigService) => {
    const usersServiceOptions = appConfigService.getInfrastructureServiceConfig();
    return ClientProxyFactory.create(usersServiceOptions);
    },
    inject: [AppConfigService, ConfigService],
  },
  {
    provide: 'TEMPLATES_SERVICE', // <-- No me gusta mucho como se agrega este servicio
    useFactory: (appConfigService: AppConfigService) => {
      return new TemplatesManager(appConfigService.getTemplatesPath());
    }, inject: [AppConfigService ],

  },
  MessagesRepositoryService,
  ],
  exports: [UbimpApplicationService, AuthService],
  imports: [UbimpInfrastructureModule, PassportModule,
            WinstonModule.forRoot({
              transports: [
                new (winston.transports.File)({
                  filename: 'filelog-info.log',
                  level: 'info',
                }),
                new (winston.transports.File)({
                  filename: 'filelog-error.log',
                  level: 'error',
                }),
              ],
            }),
            UbimpDomainModule, JwtModule.register({ secret: 'hard!to-guess_secret' }),
            MongooseModule.forFeature([
              { name: 'Message', schema: MessageSchema },
              { name: 'Messages', schema: MessagesSchema }])],
})
export class UbimpApplicationModule {}
