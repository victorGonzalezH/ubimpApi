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

@Module({
  providers: [UbimpInfrastructureService, LanguageRepository, MessagesRepository,
    CountriesRepository, DevicesRepository, VehiclesRepository, VehicleGroupRepository],
  exports: [UbimpInfrastructureService],
  imports: [MongooseModule.forFeature([
    { name: 'Message', schema: MessageSchema },
    { name: 'Messages', schema: MessagesSchema },
    { name: 'Language', schema: LanguageSchema },
    { name: 'Country', schema: CountrySchema },
    { name: 'Device', schema: DeviceSchema },
    { name: 'Vehicle', schema: VehicleSchema },
    { name: 'VehicleGroup', schema: VehicleGroupSchema },
  ]) ],
})
export class UbimpInfrastructureModule {}
