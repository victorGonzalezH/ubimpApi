import { BadRequestException, Controller, Get, InternalServerErrorException, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { Body, Param, Query } from '@nestjs/common/decorators/http/route-params.decorator';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { JwtAuthGuard } from 'uba/ubimp.application/services/auth/auth.guard';
import { ActivateDeviceCommand } from 'uba/ubimp.application/usecases/devices/commands/activate-device.command';
import { ConfirmSmsArrivedCommand } from 'uba/ubimp.application/usecases/devices/commands/confirm-sms-arrived.command';
import { DevicesApplication } from 'uba/ubimp.application/usecases/devices/devices.application.service';
import { ApiResultBaseDto, BadRequestInterceptor } from 'utils';

@UseInterceptors(BadRequestInterceptor)
@Controller('devices')
export class DevicesController {


    constructor(private ubimpApp: UbimpApplicationService, private deviceApplication: DevicesApplication) {

    }
  
    @Get('countries')
    async getCountries(): Promise<ApiResultBaseDto> {
        return await this.ubimpApp.getCountries();
    }


  @Post('activate')
  async sigIn(@Body() activateDeviceCommand: ActivateDeviceCommand): Promise<ApiResultBaseDto> {

    return await this.deviceApplication.activateDevice(activateDeviceCommand);
  }

  /**
   * LLamada que usa un cliente (dispositivo) cuando le llega un mensaje sms y confirma a el servidor que le
   * llego el mensaje. Entonces el servidor procede a crear el dispositivo (si no esta creado) y a activarlo
   */
  @Post('confirmsmsarrived')
  async confirmsmsarrived(@Body() confirmSmsArrivedCommand: ConfirmSmsArrivedCommand): Promise<ApiResultBaseDto> {

    return await this.deviceApplication.confirmSmsArrived(confirmSmsArrivedCommand);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
    async get(@Query() query): Promise<ApiResultBaseDto> {
      const properties = [];
      Object.keys(query).forEach(key => {
          if(key !== 'lang') {
            properties.push({ name: key, value: query[key]});
          }
      });

      return this.deviceApplication.getDevicesByProperties(properties, query.lang);
    }

}
