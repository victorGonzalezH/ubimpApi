import { MongoBaseRepository } from 'utils/dist/persistence/mongodb/mongoBaseRepository.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { Language } from '@ubd/ubimp.domain/models/language.model';


@Injectable()
export class LanguageRepository  extends MongoBaseRepository<Language> {

    constructor(@InjectModel('Language') private readonly languageModel: Model<Language & Document>) {
        super(languageModel);

    }

   
    /**
     * Obtiene un lenguaje con todos sus mensajes
     * @param lang
     */
    public async getLanguageWithMessages(lang: string): Promise<Language[]> {

        return await this.languageModel.find();

    }
}
