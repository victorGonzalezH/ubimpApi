import { Controller, Get, Post } from '@nestjs/common';
import { Body } from '@nestjs/common/decorators/http/route-params.decorator';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { ActivateDeviceCommand } from 'uba/ubimp.application/usecases/devices/commands/activate-device.command';
import { ConfirmSmsArrivedCommand } from 'uba/ubimp.application/usecases/devices/commands/confirm-sms-arrived.command';
import { DevicesApplication } from 'uba/ubimp.application/usecases/devices/devices.application.service';
import { ApiResultBaseDto } from 'utils';

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

}
