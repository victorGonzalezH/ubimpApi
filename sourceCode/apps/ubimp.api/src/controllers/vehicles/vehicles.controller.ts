import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { VehicleGroupDto } from 'uba/ubimp.application/dataTransferObjects/vehicleGroup.dto';
import { JwtAuthGuard } from 'uba/ubimp.application/services/auth/auth.guard';
import { VehiclesApplication } from 'uba/ubimp.application/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehiclesController {

    constructor(private vehiclesApp: VehiclesApplication) {
        
    }

    @UseGuards(JwtAuthGuard)
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
