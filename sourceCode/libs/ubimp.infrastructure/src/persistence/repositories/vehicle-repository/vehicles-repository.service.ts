import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Vehicle } from '@ubd/ubimp.domain/models/vehicle.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';

@Injectable()
export class VehiclesRepository extends MongoBaseRepository<Vehicle> {
    
    constructor(@InjectModel('Vehicle') private readonly vehicleModel: Model<Vehicle & Document>) {
        super(vehicleModel);
    }

}
