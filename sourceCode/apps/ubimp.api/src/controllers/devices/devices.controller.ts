import { Controller, Get } from '@nestjs/common';

@Controller('devices')
export class DevicesController {

    @Get('languages')
    getLanguages(): string {
        return 'This action returns all cats';
    }

}
