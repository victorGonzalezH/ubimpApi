import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Brand } from '@ubd/ubimp.domain/models/brand.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';

@Injectable()
export class BrandsRepository extends MongoBaseRepository<Brand> {

    constructor(@InjectModel('Brand') private readonly brandModel: Model<Brand & Document>) {
        super(brandModel);
    }

    
    /**
     * 
     * @param filter filter for the models
     */
    async getWithModels(filter: any): Promise<Brand[]> {
        return Object.keys(filter).length === 0 ? await this.brandModel.find(): await this.brandModel.find({ models: { $elemMatch: filter } });
    }
}
