import { MessageDto } from './messageDto.model';
import { VehicleDto } from './vehicle.dto';

export interface VehicleGroupDto {

    id: string;
    
    name: string;

    order: number;

    vehicles: VehicleDto[];

}
