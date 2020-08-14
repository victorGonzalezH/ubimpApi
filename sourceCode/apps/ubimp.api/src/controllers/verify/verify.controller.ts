import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { ApiResultBase } from 'utils';

@Controller('verify')
export class VerifyController {
    constructor(private ubimpApplication: UbimpApplicationService) {

    }

    @Get(':token')
    async get(@Param() params): Promise<ApiResultBase> {
       return  await this.ubimpApplication.verify(params.token);
    }

}
