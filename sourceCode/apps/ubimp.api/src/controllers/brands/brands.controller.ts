import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { JwtAuthGuard } from 'uba/ubimp.application/services/auth/auth.guard';
import { ApiResultBaseDto, BadRequestInterceptor } from 'utils';

@UseInterceptors(BadRequestInterceptor)
@Controller('brands')
export class BrandsController {

  constructor(private ubimpApplication: UbimpApplicationService) {

  }

  @UseGuards(JwtAuthGuard)
  @Get('models')
    async getAssigned(@Query() query): Promise<ApiResultBaseDto> {
      const properties = [];
      Object.keys(query).forEach(key => {
          properties.push({ name: key, value: query[key]});
      });

      return this.ubimpApplication.getBrandsWithModel(properties);
      
    }

}
