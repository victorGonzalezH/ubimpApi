import { Controller, Get, Post } from '@nestjs/common';
import { Body } from '@nestjs/common/decorators/http/route-params.decorator';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { ActivateDeviceCommand } from 'uba/ubimp.application/usecases/devices/commands/activate-device.command';
import { ApiResultBaseDto } from 'utils';

@Controller('devices')
export class DevicesController {


    constructor(private ubimpApp: UbimpApplicationService) {

    }

    @Get('countries')
    async getCountries(): Promise<ApiResultBaseDto> {
        return await this.ubimpApp.getCountries();
    }


  @Post('activate')
  async sigIn(@Body() activateDeviceCommand: ActivateDeviceCommand): Promise<ApiResultBaseDto> {

    return await this.ubimpApp.activateDevice(activateDeviceCommand);
  }

}
