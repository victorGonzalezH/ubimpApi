import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';


import { UbimpApplicationModule } from 'uba/ubimp.application';
import { UbimpDomainModule} from '@ubd/ubimp.domain';
import { UbimpInfrastructureModule, LanguageSchema, MessageSchema, MessagesSchema } from '@ubi/ubimp.infrastructure';


import configuration from 'uba/ubimp.application/config/configuration';
import { DatabaseConfigService } from 'uba/ubimp.application/config/databaseConfig.service';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';

import { VerifyController } from './controllers/verify/verify.controller';
import { ActivateController } from './controllers/activate/activate.controller';
import { StartupService } from './services/startup/startup.service';
import { NetController } from './controllers/net/net.controller';
import { DevicesController } from './controllers/devices/devices.controller';
import { CountrySchema } from '@ubi/ubimp.infrastructure/persistence/schemas/country.schema';
import { SocketioGateway } from './gateways/real-time-socketio.gateway';
import { DeviceSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/device.schema';
import { VehiclesController } from './controllers/vehicles/vehicles.controller';
import { VehicleSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/vehicle.schema';
import { VehicleGroupSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/vehicle-group.schema';
import { BrandsController } from './controllers/brands/brands.controller';
import { RefreshTokenSchema } from '@ubi/ubimp.infrastructure/persistence/schemas/refresh-token.schema';


@Module({
  providers: [Logger, ConfigService, AppConfigService, StartupService, SocketioGateway ],
  imports: [UbimpApplicationModule, UbimpInfrastructureModule, UbimpDomainModule,
            ScheduleModule.forRoot(),
            ConfigModule.forRoot({ load: [configuration] }),
            MongooseModule.forRootAsync({
              imports: [ConfigModule],
              useClass: DatabaseConfigService,
              inject: [ConfigService],
            }), MongooseModule.forFeature([
              { name: 'Message', schema: MessageSchema },
              { name: 'Messages', schema: MessagesSchema },
              { name: 'Language', schema: LanguageSchema },
              { name: 'Country', schema: CountrySchema },
              { name: 'Device', schema: DeviceSchema },
              { name: 'Vehicle',  schema: VehicleSchema },
              { name: 'VehicleGroup',  schema: VehicleGroupSchema },
              { name: 'RefreshToken',  schema: RefreshTokenSchema },
            ]) 
          ],
  controllers: [AppController, VerifyController, 
    ActivateController, NetController, DevicesController, VehiclesController, BrandsController],
})
export class UbimpApiModule {}
