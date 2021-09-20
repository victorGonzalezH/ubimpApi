import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { DevicesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/devices-repository/devices-repository.service';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { CallSources } from 'uba/ubimp.application/enums/callSources.enum';
import { ApiResultBase, ApiResultBaseDto, ApplicationBase, Langs } from 'utils';
import { ConfirmSmsArrivedCommand } from './commands/confirm-sms-arrived.command';
import { SendSMSCommand } from './commands/send-sms.command';
import { OnActivateDevice } from './on-activate-device.case';

@Injectable()
export class DevicesApplication extends ApplicationBase {

    constructor(
        @Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy,
        @Inject('USERS_SERVICE') private usersClient: ClientProxy,
        private devicesRepository: DevicesRepository,
        private appConfigService: AppConfigService,
    ) {
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


        /**
     * Confirma que a un dispositivo le llego el sms de validacion. Cuando esto sucede, el backend
     * verifica si el dispositivo ya se ha creado con anterioridad, sino se crear el dispositivo. El
     * usuario ya debe estar creado para este paso
     * @param confirmSmsArrivedCommand Comando para confirmar que un mensaje sms llego al dispositivo celular
     */
    public async confirmSmsArrived(confirmSmsArrivedCommand: ConfirmSmsArrivedCommand): Promise<ApiResultBaseDto> {
        
        const lang: Langs = this.converToLanguageFromString(confirmSmsArrivedCommand.Lang);

        let pattern = { command: 'getByUsername' };
            const getUserByNamePayLoad = { username: confirmSmsArrivedCommand.Email, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };

        //Se obtiene el usuario
        const userFound = await this.usersClient.send(pattern, getUserByNamePayLoad).toPromise();
        console.log(userFound);
        // El usuario debe de estar creado para para poder crearlo o actualizarlo
        if (userFound != null && userFound != undefined)
        {
            //Verificar si el dispositivo ya esta registrado mediante el imei, sino se crea el dispositivo
            let deviceFound = await this.devicesRepository.getDeviceByImei(confirmSmsArrivedCommand.Imei);
            if(deviceFound == null || deviceFound == undefined)
            {
                // Se crea el dispositivo
                const newDevice = new Device();
                newDevice.addPhoneNumber(confirmSmsArrivedCommand.PhoneNumber);
                newDevice.addUser(userFound._id);
                newDevice.imei = confirmSmsArrivedCommand.Imei;
                console.log(newDevice);
                const savedDevice = await this.devicesRepository.save(newDevice);
                console.log(savedDevice);
                return this.generateSuccessApiResultBase({id: savedDevice.id}, OnActivateDevice.SUCCESS_ON_ACTIVATE_DEVICE.message, OnActivateDevice.SUCCESS_ON_ACTIVATE_DEVICE.code, lang, OnActivateDevice.SUCCESS_ON_ACTIVATE_DEVICE.userMessageCode);
            } else { //El dispositivo ya existe, entonces es posible que se este registrando con un
                     // numero diferente
                    const lastPhoneNumber = deviceFound.getLastPhoneNumber();
                    // verificar si se esta registrando con un numero diferente
                    if(lastPhoneNumber !== confirmSmsArrivedCommand.PhoneNumber)
                    {
                        // se agrega el nuevo numero al dispositivo
                        deviceFound.addPhoneNumber(confirmSmsArrivedCommand.PhoneNumber);
                        await this.devicesRepository.update({imei: confirmSmsArrivedCommand.Imei }, deviceFound, true);
                    }
                    else // El dispositivo se esta registrando con el mismo numero
                    {

                    }
            }
        }
        else // El usuario no existe
        {

        }
        
        //Obtener el usuario 
        return null;
    }
}
