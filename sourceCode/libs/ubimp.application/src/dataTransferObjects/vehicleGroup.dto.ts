import { MessageDto } from './messageDto.model';
import { VehicleDto } from './vehicle.dto';

export interface VehicleGroupDto {

    name: string;

    order: number;

    vehicles: VehicleDto[];

}
