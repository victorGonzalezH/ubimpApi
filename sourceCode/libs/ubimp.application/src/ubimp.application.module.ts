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
import { DevicesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/devices-repository/devices-repository.service';
import { DeviceSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/device.schema';
import { VehicleGroupSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/vehicle-group.schema';
import { VehicleGroupRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-group-repository/vehicle-group-repository.service';
import { VehiclesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-repository/vehicles-repository.service';
import { VehicleSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/vehicle.schema';
import { VehiclesApplication } from './services/vehicle/vehicle.service';
import { JwtStrategy } from './services/auth/jwt.strategy';
import { BrandsRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/brands-repository/brands-repository.service';
import { BrandSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/brand.schema';
import { BrandModelSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/brand-model.schema';
import { RefreshTokenSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/refresh-token.schema';
import { RefreshTokenRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/refresh-token-repository/refresh-token-repository.service';

/**
 * Resuelve el jwt secret de acuerdo al ambiente en que se
 * esta ejecutando. NO se usa el servicio de AppConfigService
 * porque al inyectarse como dependencia el framework no lo
 * puede resolver, esto puede deberse a que el servicio
 * esta declarado en el mismo modulo application.module que 
 * es en donde se esta configurando el modulo JWT
 */
const ResolveJWTSecret = async() => {
  if (process.env.NODE_ENV == 'production')
  {
    return process.env.PROD_JWT_SECRET;
  }

    return process.env.DEV_JWT_SECRET;
};

@Module({
  providers: [UbimpApplicationService, LocalStrategy, AuthService,
    AppConfigService, ConfigService, JwtStrategy,
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
  DevicesRepository,
  VehiclesRepository,
  VehicleGroupRepository,
  VehiclesApplication,
  BrandsRepository,
  RefreshTokenRepository,
  ],
  exports: [UbimpApplicationService, AuthService, DevicesApplication, VehiclesApplication],
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
            UbimpDomainModule, JwtModule.registerAsync({useFactory: async () => ({
              secret: await ResolveJWTSecret(),
            })}),
            MongooseModule.forFeature([
              { name: 'Message',  schema: MessageSchema },
              { name: 'Messages', schema: MessagesSchema },
              { name: 'Language', schema: LanguageSchema },
              { name: 'Country',  schema: CountrySchema },
              { name: 'Device',   schema: DeviceSchema },
              { name: 'Vehicle',  schema: VehicleSchema },
              { name: 'VehicleGroup',  schema: VehicleGroupSchema },
              { name: 'Brand', schema: BrandSchema },
              { name: 'BrandModel', schema: BrandModelSchema },
              { name: 'RefreshToken',  schema: RefreshTokenSchema },
            ]),
            ],
})
export class UbimpApplicationModule {}
