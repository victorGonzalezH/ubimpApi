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

@Module({
  providers: [UbimpInfrastructureService, LanguageRepository, MessagesRepository, CountriesRepository],
  exports: [UbimpInfrastructureService],
  imports: [MongooseModule.forFeature([
    { name: 'Message', schema: MessageSchema },
    { name: 'Messages', schema: MessagesSchema },
    { name: 'Language', schema: LanguageSchema },
    { name: 'Country', schema: CountrySchema },
  ]) ],
})
export class UbimpInfrastructureModule {}
