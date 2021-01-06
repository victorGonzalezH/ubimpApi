import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map } from 'rxjs/operators';
import { ApiResultBaseDto, ApplicationBase, Langs } from 'utils';
import { SendSMSCommand } from './commands/send-sms.command';

@Injectable()
export class DevicesApplication extends ApplicationBase {

    constructor(@Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy) {
        super();
    }

    /**
     * Envia un sms
     * @param sendSMSCommand Comando para enviar un sms
     */
    public sendSMS(sendSMSCommand: SendSMSCommand): Observable<ApiResultBaseDto> {
        const pattern = { command: 'sms/MicroserviceSend' };
        const payLoad = sendSMSCommand;
        return this.infrastructureClient.send<ApiResultBaseDto>(pattern, payLoad)
        .pipe(map(result => {
            return this.generateSuccessApiResultBase(result.Data, result.ApplicationMessage, result.ResultCode, Langs.es_MX, result.UserMessage, result.Token);
        }), catchError(err => throwError(err)));
    }
}
