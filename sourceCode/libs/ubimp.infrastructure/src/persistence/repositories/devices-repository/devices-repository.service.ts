import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';

@Injectable()
export class DevicesRepository extends MongoBaseRepository<Device> {

    constructor(@InjectModel('Device') private readonly deviceModel: Model<Device & Document>) {
        super(deviceModel);
    }

    /**
     * Obtiene un dispositivo por su imei
     * @param imei imei del dispositivo
     * @returns 
     */
     public async getDeviceByImei(imei: string): Promise<Device> {
        return await this.deviceModel.findOne({ imei });
    }
}
