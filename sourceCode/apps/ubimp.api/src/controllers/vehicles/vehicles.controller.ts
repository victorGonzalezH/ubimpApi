import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { JwtAuthGuard } from 'uba/ubimp.application/services/auth/auth.guard';
import { VehiclesApplication } from 'uba/ubimp.application/services/vehicle/vehicle.service';
import { SaveVehicleCommand } from 'uba/ubimp.application/usecases/vehicles/commands/save-vehicle-command';
import { UpdateVehicleCommand } from 'uba/ubimp.application/usecases/vehicles/commands/update-vehicle-command';
import { ApiResultBaseDto } from 'utils';

@Controller('vehicles')
export class VehiclesController {

    constructor(private vehiclesApp: VehiclesApplication) {
        
    }

    @UseGuards(JwtAuthGuard)
    @Get('groups')
    async get(@Query() query): Promise<ApiResultBaseDto> {
      if(query.username != null || query.username != undefined) {
        return await this.vehiclesApp.getVehiclesGroupsWithVehiclesByUsername(query.username, query.lang);
      }
      else
      {
          throw new BadRequestException();
      }
    }
  

    @UseGuards(JwtAuthGuard)
    @Delete('groups')
    async deleteGroup(@Query() query): Promise<ApiResultBaseDto> {
      if(query.groupname != null || query.groupname != undefined &&
        query.lang != null && query.lang != undefined) {
        return await this.vehiclesApp.deleteGroup(query.groupname, query.lang);
      }
      else
      {
          throw new BadRequestException();
      }
    }


    @UseGuards(JwtAuthGuard)
    @Post()
    async save(@Body() saveVehicleCommand: SaveVehicleCommand): Promise<ApiResultBaseDto> {
      return await this.vehiclesApp.saveVehicle(saveVehicleCommand);
      
    }


    @UseGuards(JwtAuthGuard)
    @Delete()
    async delete(@Query() query): Promise<ApiResultBaseDto> {
      if(query.vehiclename != null && query.vehiclename != undefined &&
        query.groupname != null && query.groupname != undefined &&
        query.lang != null && query.lang != undefined) {
        return await this.vehiclesApp.deleteVehicle(query.vehiclename, query.groupname, query.lang);
      }

      throw new BadRequestException();
    }

    @UseGuards(JwtAuthGuard)
    @Put(':name')
    async update(@Param('name') name: string, @Body() updateVehicleCommand: UpdateVehicleCommand) {
      
      return await this.vehiclesApp.updateVehicle(name, updateVehicleCommand);
    }
}
