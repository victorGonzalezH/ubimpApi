import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { DevicesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/devices-repository/devices-repository.service';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { CallSources } from 'uba/ubimp.application/enums/callSources.enum';
import { ApiResultBase, ApiResultBaseDto, ApplicationBase, Langs, NumbersGenerator } from 'utils';
import { ActivateDeviceCommand } from './commands/activate-device.command';
import { ConfirmSmsArrivedCommand } from './commands/confirm-sms-arrived.command';
import { SendSMSCommand } from './commands/send-sms.command';
import { OnActivateDevice } from './on-activate-device.case';
import * as bcrypt from 'bcrypt';
import { SmsTypes } from './enums/sms-types.enum';
import { ApplicationBaseService } from 'uba/ubimp.application/application-base.service';
import { MessagesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service';
import { CountriesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/countries-repository/countries-repository.service';

@Injectable()
export class DevicesApplication extends ApplicationBaseService {

    constructor(
        @Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy,
        @Inject('USERS_SERVICE') usersClient: ClientProxy,
        private devicesRepository: DevicesRepository,
        appConfigService: AppConfigService,
        messagesRepository: MessagesRepository,
        private countriesRepository: CountriesRepository
    ) {
        super(appConfigService, messagesRepository, usersClient);
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


    /**
     *
     * @param adc Comando para activar un dispositivo
     */
     public async activateDevice(adc: ActivateDeviceCommand): Promise<ApiResultBaseDto> {
        
        let userFound = null;
        const lang: Langs = this.converToLanguageFromString(adc.Lang);
        try {
            
            // Se obtiene el usuario
            userFound = await this.getUser(adc.Email);
            // Si se encuentra el usuario
            if (userFound != null) {
                // Se verifica que la contrasena sea la correcta
                if (bcrypt.compareSync(adc.Password, userFound.password) === true) {
                    // Genera el codigo de verificacion
                    const verificationCode = NumbersGenerator.getVerificationCode(this.appConfigService.smsVerificationCodeLength, { type: 'string' });

                    try {
                        // Se obtiene el pais de acuerdo al countryId del comando
                        const country = await this.countriesRepository.getByCountryId(Number(adc.CountryId));
                        // se forma el mensaje que consta del sello de tiempo que envio el dispositivo y
                        // el codigo de verificacion que se genero
                        const message = adc.TimeStamp + ' ' + verificationCode;
                        // Se envia el mensaje a el dispositivo por sms
                        const phoneNumberWithCountryCode = country.phoneCode + adc.PhoneNumber;
                        
                        try 
                        {
                            // Se envia el mensaje sms
                            const resultSms = await this.sendSMS({ message: message, phoneNumber: phoneNumberWithCountryCode, senderId: 'ubimp', smsType: SmsTypes.Transactional }).toPromise();
                            if(resultSms.isSuccess == true || resultSms.IsSuccess === true)
                            {   // Si el envio del sms es exitoso, entonces se envia el codigo de verificacion generado a el dispositivo en la respuesta
                                // de la llamada post, con esto el dispositivo leera el sms y buscara el mismo codigo de activacion. Ademas para garantizar
                                // que se trata del sms que espera tambien leera la marca de tiempo (timestamp) en el sms
                                return this.generateSuccessApiResultBase(verificationCode, resultSms.applicationMessage, resultSms.resultCode, lang, resultSms.userMessage, resultSms.token);
                            }
                            else
                            {
                                return await this.generateCustomErrorApiResultBase({},
                                    OnActivateDevice.ERROR_ON_SENDING_SMS_MESSAGE.userMessageCode,
                                    OnActivateDevice.ERROR_ON_SENDING_SMS_MESSAGE.message,
                                    OnActivateDevice.ERROR_ON_SENDING_SMS_MESSAGE.code,
                                    lang, null);
                            }
                        }
                        catch(exception)
                        {
                            return await this.generateCustomErrorApiResultBase(exception,
                                    OnActivateDevice.ERROR_ON_ACTIVATE_DEVICE_ERROR_ON_SMS_SERVICE .userMessageCode,
                                    OnActivateDevice.ERROR_ON_ACTIVATE_DEVICE_ERROR_ON_SMS_SERVICE.message,
                                    OnActivateDevice.ERROR_ON_ACTIVATE_DEVICE_ERROR_ON_SMS_SERVICE.code,
                                    lang, null);
                        }
                    } catch (exception) {
                        return await this.generateCustomErrorApiResultBase(exception,
                            OnActivateDevice.ERROR_ON_GETTING_COUNTRY.userMessageCode,
                            OnActivateDevice.ERROR_ON_GETTING_COUNTRY.message,
                            OnActivateDevice.ERROR_ON_GETTING_COUNTRY.code,
                            Langs.es_MX, null);
                    }

                } else {
                    return this.generateErrorApiResultBase({message: 'Please verify email and/or password'}, '', 1, 'Please verify email and/or password', null);
                }

              }

        } catch (exception) {
            return await this.generateCustomErrorApiResultBase(exception,
                OnActivateDevice.ERROR_ON_USER_SERVICE.userMessageCode,
                OnActivateDevice.ERROR_ON_USER_SERVICE.message,
                OnActivateDevice.ERROR_ON_USER_SERVICE.code,
                lang, null);
        }
        
    }
}
