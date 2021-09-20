import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VehicleGroup } from '@ubd/ubimp.domain/models/vehicle-group.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';


@Injectable()
export class VehicleGroupRepository extends MongoBaseRepository<VehicleGroup> {

    constructor(@InjectModel('VehicleGroup') private readonly vehicleGroupModel: Model<VehicleGroup & Document>) {
        super(vehicleGroupModel);
    }

}
