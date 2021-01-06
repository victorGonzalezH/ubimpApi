import { Module } from '@nestjs/common';
import { UbimpApplicationService } from './ubimp.application.service';
import { AuthService } from './services/auth/auth.service';
import { LocalStrategy } from './services/auth/local.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UbimpInfrastructureModule, MessageSchema, MessagesSchema, LanguageSchema } from '@ubi/ubimp.infrastructure';
import { UbimpDomainModule } from '@ubd/ubimp.domain';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ClientProxyFactory } from '@nestjs/microservices';
import { AppConfigService } from './config/appConfig.service';
import { ConfigService } from '@nestjs/config';
import { TemplatesManager } from './services/templates/templatesManager.service';
import { MessagesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service';
import { WinstonModule } from 'nest-winston';
import { DevicesApplication } from './usecases/devices/devices.application.service';
import * as winston from 'winston';
import { LanguageRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/language.repository.service';
import { CountrySchema } from '@ubi/ubimp.infrastructure/persistence/schemas/country.schema';
import { CountriesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/countries-repository/countries-repository.service';

@Module({
  providers: [UbimpApplicationService, LocalStrategy, AuthService,
    AppConfigService, ConfigService,
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
  MessagesRepository,
  DevicesApplication,
  LanguageRepository,
  CountriesRepository,
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
              { name: 'Messages', schema: MessagesSchema },
              { name: 'Language', schema: LanguageSchema },
              { name: 'Country', schema: CountrySchema },
            ]),
            ],
})
export class UbimpApplicationModule {}
