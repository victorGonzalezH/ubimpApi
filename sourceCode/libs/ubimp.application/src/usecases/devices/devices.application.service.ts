import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { DevicesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/devices-repository/devices-repository.service';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { CallSources } from 'uba/ubimp.application/enums/callSources.enum';
import { ApiResultBase, ApiResultBaseDto, AppBadRequestException, AppInternalServerError, ApplicationBase, DataTypes, Langs, NumbersGenerator } from 'utils';
import { ActivateDeviceCommand } from './commands/activate-device.command';
import { ConfirmSmsArrivedCommand } from './commands/confirm-sms-arrived.command';
import { SendSMSCommand } from './commands/send-sms.command';
import { OnActivateDevice } from './on-activate-device.case';
import * as bcrypt from 'bcrypt';
import { SmsTypes } from './enums/sms-types.enum';
import { ApplicationBaseService } from 'uba/ubimp.application/application-base.service';
import { MessagesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service';
import { CountriesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/countries-repository/countries-repository.service';
import { bool } from 'aws-sdk/clients/signer';
import { DeviceDto } from './dtos/device.dto';
import { User } from '@ubd/ubimp.domain/models/user.model';
import { UserStatus } from '../CreateOnVerificationUser/userStatus.enum';
import { OnGettingDevices } from './on-getting-devices.case';
import { UpdateDeviceCommand } from './commands/update-device-command';

@Injectable()
export class DevicesApplication extends ApplicationBaseService {

    constructor(
        messagesRepository: MessagesRepository,
        appConfigService: AppConfigService,
        @Inject('USERS_SERVICE') usersClient: ClientProxy,
        private countriesRepository: CountriesRepository,
        private devicesRepository: DevicesRepository,
        @Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy
    ) {
        super(messagesRepository, appConfigService, usersClient);
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
                const savedDevice = await this.devicesRepository.save(newDevice);
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

    /**
     * 
     * @param imei imei
     * @returns The device with the specified imei
     */
    public async getDeviceByImei(imei: string) : Promise<Device> {
        const filter = { imei: imei };
        const result = await this.devicesRepository.getAllByFilter(filter);
        return result.length > 0 ? result[0] as Device: null;
    }


    /**
     * Gets devices that are assigned or not
     * @param assigned flag that indicates if the devices are asissigned or not
     * @returns 
     */
    public async getDevicesAssigned(assigned: bool) {
        const filter = { isAssigned: assigned };
        const devices = await this.devicesRepository.getAllByFilter(filter);
        return await this.generateSuccessApiResultBase(devices, ApiResultBase.SUCCESS, ApiResultBase.SUCCESS_CODE, null, ApiResultBase.SUCCESS, null);
        
    }
    

    /**
     * 
     * @param properties 
     * @returns 
     */
    public async getDevicesByProperties(properties: Array<{ name: string, value: string }>, langParam: string): Promise<ApiResultBaseDto> {
        try {
            const lang = langParam as Langs;
            const filter = {};
            const device: Device = new Device();
            
            // Here we define the allowed properties that can be used to query the entities
            // its important that at the constructor of the model we set this properties to a 
            //initial value
            
            const props:(keyof Device)[] = [ 'isAssigned', 'imei', 'currentOwnerId' ];
            for(let i = 0; i < properties.length; i++) {
                let propertyName = properties[i].name;
                let propertyValue = properties[i].value;

                if (properties[i].name === 'username') {
                    propertyName = 'currentOwnerId';
                    // buscar el usuario
                    const pattern = { command: 'getByUsername' };
                    const getUserByNamePayLoad = { username: properties[i].value, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };
                    
                    let userFound: User = null;
                    try  {
                        
                        // Se hace la llamada al servicio de usuarios para obtener el usuario
                        userFound = await this.usersClient.send(pattern, getUserByNamePayLoad).toPromise();
                        if (userFound != null && userFound != undefined) {
                            if(userFound.userStatus === UserStatus.Activated) {
                                // We have to check if this is an owner or a extended user, this is done
                                //by checking the ownerId property, if it is null is a owner user
                                if(userFound.ownerId == null) { // Si es nulo entonces es un usuario dueno
                                    propertyValue = userFound._id;
                                } else { 
                                        
                                    // no es un usuario dueno, entonces si usa su ownerId para obtener el
                                    // usuario dueno
                                    const ownerUser: User = await this.getUserById(userFound.ownerId);
                                    if(ownerUser != null && ownerUser != undefined) {
                                        if(userFound.userStatus === UserStatus.Activated) {
                                            propertyValue = ownerUser._id;
                                        } else {
                                            const error = new AppInternalServerError(OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.message);
                                            return this.generateCustomErrorApiResultBase(error, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.userMessageCode, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.message, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.code, lang);
                                        }
                                    } 
                                        else {
                                            const error = new AppInternalServerError(OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.message);
                                            return this.generateCustomErrorApiResultBase(error, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.userMessageCode, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.message, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.code, lang);
                                    }
                                }
                                
                            } 
                            else {
                                const error = new AppInternalServerError(OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.message);
                                return this.generateCustomErrorApiResultBase(error, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.userMessageCode, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.message, OnGettingDevices.ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES.code, lang);
                            }
                        
                        } else {
                            const error = new AppInternalServerError(OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.message);
                            return this.generateCustomErrorApiResultBase(error, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.userMessageCode, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.message, OnGettingDevices.ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES.code, lang);
                        }
                    } catch (exception)  {

                        return this.generateCustomErrorApiResultBase(exception, OnGettingDevices.ERROR_UNKNOW_ON_GETTING_DEVICES.userMessageCode, OnGettingDevices.ERROR_UNKNOW_ON_GETTING_DEVICES.message, OnGettingDevices.ERROR_UNKNOW_ON_GETTING_DEVICES.code, lang);
                    }
                } 

                const property = props.filter(item => item === propertyName)[0];
                if(property !== undefined) {    
                    filter[propertyName] = this.fromStringToPrimitive(typeof device[property], propertyValue);
                }
                else {
                    throw new AppBadRequestException();
                }
            }

            const devices = await this.devicesRepository.getAllByFilter(filter);
            
            const devicesDtos: DeviceDto[] = devices.map(item => {
                const deviceDto :DeviceDto = { imei: item.imei, id: item._id };
                return deviceDto;
              });
              
            return this.generateSuccessApiResultBase(devicesDtos, ApiResultBase.SUCCESS, ApiResultBase.SUCCESS_CODE, null, ApiResultBase.SUCCESS, null);
    }
        catch(error) {
            throw error;
        }
    }




    public async updateVehicle(imei: string, updateDeviceCommnand: UpdateDeviceCommand): Promise<ApiResultBaseDto> {

        try 
        {
            return null;
        } 
        catch(exception) {

        }
        
    }

}
