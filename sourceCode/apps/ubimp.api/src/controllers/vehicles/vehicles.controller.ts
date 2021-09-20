import { BadRequestException, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VehicleGroupDto } from 'uba/ubimp.application/dataTransferObjects/vehicleGroup.dto';
import { VehiclesApplication } from 'uba/ubimp.application/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehiclesController {

    constructor(private vehiclesApp: VehiclesApplication) {
        
    }

    @Get('groups')
    async get(@Query() query): Promise<VehicleGroupDto[]> {
      if(query.userid !== undefined || query.userId !== undefined)
      {
        return await this.vehiclesApp.getVehicleGroupWithVehiclesByUserId(query.userId);
      }
      else
      {
          throw new BadRequestException();
      }

    }
  
    
}
