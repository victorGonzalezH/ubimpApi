import { Injectable } from '@nestjs/common';
import { VehicleGroupRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-group-repository/vehicle-group-repository.service';
import { VehiclesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-repository/vehicles-repository.service';
import { filter } from 'rxjs/operators';
import { VehicleGroupDto } from 'uba/ubimp.application/dataTransferObjects/vehicleGroup.dto';
import { ApplicationBase } from 'utils';

@Injectable()
export class VehiclesApplication extends ApplicationBase{

    constructor(private vehiclesRepository: VehiclesRepository, private vehicleGroupRepository: VehicleGroupRepository) {
        super();
    }


    public async getVehicleGroupWithVehiclesByUserId(userId: string): Promise<VehicleGroupDto[]> {
        const userIdFilter = { userId: userId };
        const vehicles = await this.vehiclesRepository.getAllByFilter(filter);
        const vehiclesGroups = await this.vehiclesRepository.getAllByFilter(filter);
        const vehiclesGroupDto: VehicleGroupDto[]  = [];
        return vehiclesGroupDto;
    }
}
