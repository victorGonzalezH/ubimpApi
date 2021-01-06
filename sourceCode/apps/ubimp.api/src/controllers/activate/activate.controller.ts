import { Controller, Post, Body } from '@nestjs/common';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { ApiResultBaseDto, Langs } from 'utils';

@Controller('activate')
export class ActivateController {

    constructor(private ubimpApplication: UbimpApplicationService) {

    }

    /**
     *
     * @param tokenCommand
     */
    @Post()
    async activate(@Body() tokenCommand: { token: string, lang: string}): Promise<ApiResultBaseDto> {
       return  await this.ubimpApplication.activate(tokenCommand.token, tokenCommand.lang as Langs);
    }

}
