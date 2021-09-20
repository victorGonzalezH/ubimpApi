import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Country } from '@ubd/ubimp.domain/models/country.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';

@Injectable()
export class CountriesRepository extends MongoBaseRepository<Country>  {

    constructor(@InjectModel('Country') private readonly countryModel: Model<Country & Document>) {
        super(countryModel);
    }

    /**
     * Obtiene un pais por su identificador alterno, aquel que no es el id que asigna la base de datos
     * @param countryId Id alterno
     */
    public async getByCountryId(countryId: number): Promise<Country> {
        return await this.countryModel.findOne({ countryId });
    }
}
