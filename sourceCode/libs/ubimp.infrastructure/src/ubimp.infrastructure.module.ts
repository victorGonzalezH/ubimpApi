import { Module } from '@nestjs/common';
import { UbimpInfrastructureService } from './ubimp.infrastructure.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesRepository } from './persistence/repositories/messages.repository.service';
import { LanguageRepository } from './persistence/repositories/language.repository.service';
import { MessageSchema } from './persistence/schemas/message.schema';
import { MessagesSchema } from './persistence/schemas/messages.schema';
import { LanguageSchema } from './persistence/schemas/language.schema';
import { CountriesRepository } from './persistence/repositories/countries-repository/countries-repository.service';
import { CountrySchema } from './persistence/schemas/country.schema';
import { DevicesRepository } from './persistence/repositories/devices-repository/devices-repository.service';
import { DeviceSchema } from './persistence/schemas/device.schema';
import { VehiclesRepository } from './persistence/repositories/vehicle-repository/vehicles-repository.service';
import { VehicleGroupRepository } from './persistence/repositories/vehicle-group-repository/vehicle-group-repository.service';
import { VehicleSchema } from './persistence/schemas/vehicle.schema';
import { VehicleGroupSchema } from './persistence/schemas/vehicle-group.schema';
import { BrandsRepository } from './persistence/repositories/brands-repository/brands-repository.service';
import { BrandSchema } from './persistence/schemas/brand.schema';
import { BrandModelSchema } from './persistence/schemas/brand-model.schema';
import { UserPrefRepositoryService } from './persistence/repositories/user-pref-repository/user-pref-repository.service';
import { RefreshTokenRepository } from './persistence/repositories/refresh-token-repository/refresh-token-repository.service';
import { RefreshTokenSchema } from './persistence/schemas/refresh-token.schema';

@Module({
  providers: [UbimpInfrastructureService, LanguageRepository, MessagesRepository,
    CountriesRepository, DevicesRepository, VehiclesRepository, VehicleGroupRepository,
    BrandsRepository, UserPrefRepositoryService, RefreshTokenRepository],
  exports: [UbimpInfrastructureService],
  imports: [MongooseModule.forFeature([
    //We must dechlae the schemas here due that they are injected into
    //the repositories constructors
    { name: 'Message', schema: MessageSchema },
    { name: 'Messages', schema: MessagesSchema },
    { name: 'Language', schema: LanguageSchema },
    { name: 'Country', schema: CountrySchema },
    { name: 'Device', schema: DeviceSchema },
    { name: 'Vehicle', schema: VehicleSchema },
    { name: 'VehicleGroup', schema: VehicleGroupSchema },
    { name: 'Brand', schema: BrandSchema },
    { name: 'BrandModel', schema: BrandModelSchema },
    {name: 'RefreshToken', schema: RefreshTokenSchema},
  ]) ],
})
export class UbimpInfrastructureModule {}
