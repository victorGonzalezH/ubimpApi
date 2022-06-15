import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { Subject, Observable, throwError, from } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { ClientProxy } from '@nestjs/microservices';
import { SignInCommand } from './services/auth/signIn.command';
import { TemplatesManager } from './services/templates/templatesManager.service';
import { TemplatesTypes } from './services/templates/templatesTypes.enum';
import { Message } from '@ubd/ubimp.domain';
import { JwtService } from '@nestjs/jwt';
import { CreateOnVerificationUserCommand } from './usecases/CreateOnVerificationUser/createOnVerficationUser.command';
import * as bcrypt from 'bcrypt';
import * as crypto from "crypto";
import { UserTypes } from './usecases/CreateOnVerificationUser/userTypes.enum';
import { CallSources } from './enums/callSources.enum';
import { UserStatus } from './usecases/CreateOnVerificationUser/userStatus.enum';
import { SignOptions } from 'jsonwebtoken';
import { OnVerificationUserUseCase } from './usecases/CreateOnVerificationUser/onVerificationUserUseCase.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ApiResultBase, AppBaseException, DataTypes, HOURS_IN_A_DAY, MILISECONDS_IN_A_SECOND, MINUTES_IN_A_HOUR, SECONDS_IN_A_MINUTE } from 'utils';
import { SendEmailCommand } from './commands/sendEmail.command';
import { CreateOnVerificationUserDto } from './usecases/CreateOnVerificationUser/createOnVerificationUser.dto';
import { TypesConverter } from 'utils';
import { ActivateAccountUseCase } from './usecases/verifyAccount/ActivateAccount.case';
import { ApiResultBaseDto, AppBadRequestException, AppInternalServerError, ApplicationBase, Langs } from 'utils';
import { VerifyTokenAndAccountResult } from './usecases/verifyAccount/verifyTokenAndAccountResult.enum';
import { RunTcpServerCommand } from './commands/runTcpServer.command';
import { LanguageRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/language.repository.service';
import { CountryDto } from './usecases/devices/dtos/country.model';
import { DevicesApplication } from './usecases/devices/devices.application.service';
import { SendSMSCommand } from './usecases/devices/commands/send-sms.command';
import { CountriesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/countries-repository/countries-repository.service';
import * as buffer from 'buffer';
import { AuthenticatedUser } from './models/authenticated-user.model';
import { Socket } from 'socket.io';
import { ApplicationBaseService } from './application-base.service';
import { AppConfigService } from './config/appConfig.service';
import { MessagesRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service';
import { ISensingCurrentDevice } from './usecases/onTcpMessagesArrived/isensing-current-device.model';
import { User } from '@ubd/ubimp.domain/models/user.model';
import { ISocketLocation } from './usecases/onTcpMessagesArrived/isocket-location.model';
import { ITrackingLocation } from './usecases/onTcpMessagesArrived/itracking-location.model';
import { Device } from '@ubd/ubimp.domain/models/devices/device.model';
import { BrandsRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/brands-repository/brands-repository.service';
import { Brand } from '@ubd/ubimp.domain/models/brand.model';
import { BrandModel } from '@ubd/ubimp.domain/models/brand-model.model';
import { BrandDto } from './usecases/vehicles/dtos/brand.dto';
import { BrandModelDto } from './usecases/vehicles/dtos/brand-model.dto';
import { OnSiginUserUseCase } from './usecases/users/on-signin-user.usecase';
import { VehicleGroupRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/vehicle-group-repository/vehicle-group-repository.service';
import { VehicleGroup } from '@ubd/ubimp.domain/models/vehicle-group.model';
import { Roles } from '@ubd/ubimp.domain/enums/roles.enum';
import { RefreshToken } from '@ubd/ubimp.domain/models/refresh-token.model';
import { RefreshTokenRepository } from '@ubi/ubimp.infrastructure/persistence/repositories/refresh-token-repository/refresh-token-repository.service';

const MIN_TCP_DATA_LENGTH = 8;
const RANDOM_STRING_BUFFER_SIZE = 40;
const MAX_ACTIVATION_ATTEMPTS = 3;


@Injectable()
export class UbimpApplicationService extends ApplicationBaseService {

     /**
     * Subject para emitir los valores recibidos de los clientes tcp como valores tipo ITrackingLocation
     */
    private locationsEmitter: Subject<ISocketLocation>;

    /**
     * Observable del subject para emitir los valores recibidos de los clientes tcp como valores tipo ITrackingLocation
     */
    get locations(): Observable<ISocketLocation> {
        return this.locationsEmitter.asObservable();
    }

    /**
     * 
     * Cache de los dispositivos que se encuentran sensando actualmente (aquellos que estan enviando ubicacion).
     * Esta cache se va construyendo conforme van enviando su ubicacion
       Cuando se recibe un mensaje de ubicacion se pregunta primero si el dispositivo se encuentra en la cache
       si no, se busca en la base de datos. La propiedad lastSensingDate guarda la ultima fecha en
       que un dispositivo envio la ubicacion
       Esta cache debe de implementarse en un sistema de cache como redis cuando el numero de dispositivos
       se incremente considerablemente
     *  */
    public sensingCurrentDevices: Record<string, ISensingCurrentDevice>;

    /**
     * Cache de usuarios autenticados actualmente. En esta cache se agregan los usuarios que se autentican con exito.
     * It is important to note that if the server is reeboted, this cache will be losed. La llave para 
     * acceder a los usuarios autenticados es el token generado al momento de autenticarse correctamente
     * 
     */
     public authenticatedUsers: Record<string, AuthenticatedUser>;
     
     /**
      * Cache que relaciona el id del usuario con su token de autenticacion, Aqui se guardan las tuplas ids y token
      * de los usuarios autenticados. Esta cache se usa cuando llega un mensaje de ubicacion de un dispositivo
      * este mensaje trage el imei del dispositivo, si el dispositivo se encuentra en la cache sensingCurrentDevices, se 
      * obtiene desde ahi, sino se obtiene desde la base de datos. Este dispositivo trae consigo el ownerId del usuario
      * este usuario es el propietario del dispositivo. Este id es el mismo id de la tabla de usuarios, para obtener
      * el token y socket client (para enviar mensajes de tiempo real) se usa esta cache que relaciona el id y el token del
      * usuario
      */
     //public authenticatedtokenUsersById: Record<string, string>;

     private ownerIdUsersToKens : Record<string, {}>

    constructor(
                messagesRepository: MessagesRepository,
                appConfigService: AppConfigService,
                @Inject('USERS_SERVICE') usersClient: ClientProxy,
                private jwtService: JwtService,
                private countriesRepository: CountriesRepository,
                private devicesApplication: DevicesApplication,
                private brandsRepository: BrandsRepository,
                @Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy,
                @Inject('TEMPLATES_SERVICE') private templatesManager: TemplatesManager,
                @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
                private vehicleGroupRepository: VehicleGroupRepository,
                private refreshTokenRepository: RefreshTokenRepository) {
        super(messagesRepository, appConfigService, usersClient);
        
        this.locationsEmitter = new Subject<ISocketLocation>();
        this.authenticatedUsers = {};
        this.ownerIdUsersToKens = {};
        this.sensingCurrentDevices = {};
    }


    /**
     * 
     * @param objectWithUsernameProperty 
     */
    private isObjectWithUsernameProperty(objectWithUsernameProperty: VerifyTokenAndAccountResult | { username: string }): objectWithUsernameProperty is { username: string } {
        return (objectWithUsernameProperty as { username: string }).username !== undefined;
      }


    /**
     * Guarda un usuario, se contruye la plantilla de activacion y se envia el correo de activacion al usuario
     * @param signInCommand
     */
    public async addUserAndSendActivationEmail(signInCommand: SignInCommand): Promise<ApiResultBaseDto> {
        let lang: Langs;
        try {
            // Si el comando no especifica un lenguaje, entonces, se asigna el lenguaje predeterminado que usa la aplicacion
            if (signInCommand.lang == null || signInCommand == undefined ) {
                signInCommand.lang = this.appConfigService.getDefaultLanguage();
                lang = this.converToLanguageFromString(signInCommand.lang);
            } else {
                
                lang = this.converToLanguageFromString(signInCommand.lang);
            }
            
            // Se asigna el identificador del sistema al comando para guardar el usuario
            signInCommand.systemId = this.appConfigService.getSystemId();

            let pattern = { command: 'getByUsername' };
            const getUserByNamePayLoad = { username: signInCommand.username, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };

            let userFound = null;
            try {
             // Se hace la llamada al servicio de usuarios para obtener el usuario
             userFound = await this.usersClient.send(pattern, getUserByNamePayLoad).toPromise();
            } catch (exception) {
                const msg = `code: ${OnSiginUserUseCase.ERROR_GET_USER.code}, msg: ${OnSiginUserUseCase.ERROR_GET_USER.message}, ex: ${exception}`;
                this.logger.error(msg);

                return await this.generateCustomErrorApiResultBase( exception, OnSiginUserUseCase.ERROR_GET_USER.userMessageCode, OnSiginUserUseCase.ERROR_GET_USER.message, OnSiginUserUseCase.ERROR_GET_USER.code, lang);
            }

            if (userFound != null && userFound != undefined && userFound.userStatus != undefined && userFound.userStatus === UserStatus.Blacklisted) {
                // Inform to the user
                return await this.generateCustomErrorApiResultBase(null,
                    OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.userMessageCode,
                    OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.message, OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.code, lang);

            } // Si el usuario ya existe y esta activado, entonces se esta tratando de activar/registrar de nuevo el usuario
            else if (userFound != null && userFound != undefined && userFound.userStatus != undefined && userFound.userStatus === UserStatus.Activated) {
                return await this.generateCustomErrorApiResultBase(new AppBaseException(),
                    OnVerificationUserUseCase.ERROR_USER_ALREADY_EXIST.userMessageCode,
                    OnVerificationUserUseCase.ERROR_USER_ALREADY_EXIST.message, OnVerificationUserUseCase.ERROR_USER_ALREADY_EXIST.code, lang);
            } 
            else  {
            
            const activationId = Date.now(); // Se usa la hora y la fecha actual (now) para el id de activacion
            const verificationToken = await this.generateToken({ id: activationId.toString() }, this.appConfigService.activationTokenOptions);

            // Se genera la url para verificar la cuenta
            const urlVerify: string = `${this.appConfigService.currentWebHost}/${OnVerificationUserUseCase.ACTIVATE_URL_PATH}/?res=${verificationToken}`;

            // Se obtiene la plantilla de activacion de cuenta y se reemplaza el nombre del usuario que se desea registrarse
            const sourceTemplate = await this.templatesManager.getTemplate(OnVerificationUserUseCase.verificationUserTemplate.code, signInCommand.lang, OnVerificationUserUseCase.verificationUserTemplate.type);
            if(sourceTemplate !==  null) {

                // Se reemplazan las etiquetas del nombre y la url
            const keysValues = new Map<string, string>();
            keysValues.set('@name,', `${signInCommand.name} ${signInCommand.lastName}`);
            keysValues.set('@urlVerify', urlVerify);
            const newTemplate = await this.templatesManager.replaceContent(sourceTemplate.code, signInCommand.lang, TemplatesTypes.HTML, keysValues);
            
            let wasSendIt: boolean = false;
            try {
                const sendEmailCommand: SendEmailCommand = { tos: [ signInCommand.username ], body: newTemplate.content, isBodyHtml: true, lang: signInCommand.lang, subjectCode: 'EMAIL_SUBJECT_ACTIVATE_ACCOUNT' };
                wasSendIt = (await this.sendEmail(sendEmailCommand).toPromise<boolean>());

            } catch (exception) {
                const msg = `code:${OnSiginUserUseCase.ERROR_SENDING_EMAIL.code}, msg: ${OnSiginUserUseCase.ERROR_SENDING_EMAIL.message}, ex: ${exception}`;
                this.logger.error(msg);
                return this.generateCustomErrorApiResultBase(exception, OnSiginUserUseCase.ERROR_SENDING_EMAIL.userMessageCode, OnSiginUserUseCase.ERROR_SENDING_EMAIL.message, OnSiginUserUseCase.ERROR_SENDING_EMAIL.code, signInCommand.lang);
            }

             // Si el correo fue enviado con exito. Aqui se permite enviar el correo antes de veirificar si el
             // usuario esta en proceso de verificacion, porque aunque se haya enviado el correo correctamente no es
             // garantia de que le haya llegado a el usuario. Aun asi, si el usuario empieza a intentar registrarse varias veces, al 4 intento
             // el sistema bloquea ese usuario (cuenta de correo) para que ya no se envie correo
            if (wasSendIt === true) {
                
                // Si el usuario no existe
                if (userFound == null || userFound == undefined) {

                    // Se obtiene un "salt" que es necesario para la generacion del hash
                    const salt = bcrypt.genSaltSync(this.appConfigService.passwordSaltRounds);
                    // se hace el hashing de la contrasena
                    const securePassword = bcrypt.hashSync(signInCommand.password,  salt);

                    //Calculates the role
                    const roleId = this.calculateUserRolId(signInCommand);

                    pattern = { command: 'save' };
                    // Se crea el comando para crear el usuario Todos los usuarios que se crean por primera vez se crean con estado
                    // OnVerification
                    const userPayload = { 
                        saveUserCommand:
                        CreateOnVerificationUserCommand
                        .createCommand(signInCommand.username, securePassword, signInCommand.name,
                        signInCommand.lastName, signInCommand.secondLastName, signInCommand.countryId, signInCommand.stateId,
                         signInCommand.number, signInCommand.postalCode, signInCommand.ownerId, this.appConfigService.getSystemId(), roleId, UserTypes.Owner, activationId)};

                    try {
                        // Se hace la llamada al servicio de usuarios para crearlo
                        const onVerificationUser = await this.usersClient.send(pattern, userPayload).toPromise();
                        if (onVerificationUser != null && onVerificationUser != undefined) {
                            const data: CreateOnVerificationUserDto = { verificationToken };
                            return this.generateCustomSuccessApiResultBase(data,
                                OnVerificationUserUseCase.SUCCESS_ON_USER_VERIFICATION.userMessageCode,
                                OnVerificationUserUseCase.SUCCESS_ON_USER_VERIFICATION.message,
                                OnVerificationUserUseCase.SUCCESS_ON_USER_VERIFICATION.code,
                                signInCommand.lang);
                        } else {
                            const msg = `code:${OnSiginUserUseCase.ERROR_CREATE_USER.code}, msg: ${OnSiginUserUseCase.ERROR_CREATE_USER.message}, ex: ${{}}`;
                            this.logger.error(msg);
                            return this.generateCustomErrorApiResultBase({}, 'ERROR_CREATE_USER', OnSiginUserUseCase.ERROR_CREATE_USER.message, OnSiginUserUseCase.ERROR_CREATE_USER.code, signInCommand.lang);
                        }
                    } catch (exception) {
                        const msg = `code:${OnSiginUserUseCase.ERROR_CREATE_USER.code}, msg: ${OnSiginUserUseCase.ERROR_CREATE_USER.message}, ex: ${exception}`;
                        this.logger.error(msg);
                        return this.generateCustomErrorApiResultBase(exception, 'ERROR_CREATE_USER', OnSiginUserUseCase.ERROR_CREATE_USER.message, OnSiginUserUseCase.ERROR_CREATE_USER.code, signInCommand.lang);
                    }

                } else { // Si si existe, y se encuentra en verificacion, se tiene que actualizar los intentos de
                        // actualizacion
                        pattern = { command: 'update' };
                        if (userFound.userStatus === UserStatus.OnVerification ) {
                        if (userFound.activationAttempts + 1 > MAX_ACTIVATION_ATTEMPTS) {
                            // Blacklistear al usuario pues ya sobrepaso los intentos de verificacion de cuenta
                            const updatePayload = { username: signInCommand.username, systemId: this.appConfigService.getSystemId(), update: { userStatus: UserStatus.Blacklisted }, callSource: CallSources.Microservice };
                            const blacklistedUserUpdated = await this.usersClient.send<ApiResultBaseDto>(pattern, updatePayload).toPromise();
                            if (blacklistedUserUpdated != null && blacklistedUserUpdated != undefined) {
                                if (TypesConverter.hasProperty(blacklistedUserUpdated, 'data') === true && TypesConverter.hasProperty(blacklistedUserUpdated, 'isSuccess') === true) {
                                    if ( blacklistedUserUpdated.isSuccess === true ) {
                                        const data: CreateOnVerificationUserDto = { verificationToken };
                                        return this.generateCustomErrorApiResultBase({},
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.userMessageCode,
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.message,
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.code,
                                        signInCommand.lang);
                                    } else {
                                        const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (blacklisted), the service return an apiresultBase with error`;
                                        this.logger.error(msg);
                                        if (blacklistedUserUpdated.error != undefined && blacklistedUserUpdated.error != null) {
                                            return this.generateCustomErrorApiResultBase(blacklistedUserUpdated.error, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                        }
                                        // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                        // y el mensaje de aplicacion y error se usan los genericos
                                        return this.generateCustomErrorApiResultBase({ message: 'can not update user, the service return an apiresultBase with error'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                    }

                                } else {
                                    const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user, the service return a not apiresultBase`;
                                    this.logger.error(msg);
                                    // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                    // y el mensaje de aplicacion y error se usan los genericos
                                    return this.generateCustomErrorApiResultBase({ message: 'can not update user, the service return a not apiResultBase'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                }
                            } else {
                                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (blacklisted), the service return null`;
                                this.logger.error(msg);
                                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                // y el mensaje de aplicacion y error se usan los genericos
                                return this.generateCustomErrorApiResultBase({message: 'can not update user (blacklisted), the service return null'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                            }
                        } else {

                            const updatePayload = { username: signInCommand.username, systemId: this.appConfigService.getSystemId(), update: { activationAttempts: userFound.activationAttempts + 1, activationId }, callSource: CallSources.Microservice };
                            const onVerificationUserUpdated = await this.usersClient.send<ApiResultBaseDto>(pattern, updatePayload).toPromise();

                            if (onVerificationUserUpdated != null && onVerificationUserUpdated != undefined) {
                                // Se verifica si el objeto onVerificationUserUpdated es un objeto de tipo ApiResultBase
                                // par ello, preguntamos
                                if (TypesConverter.hasProperty(onVerificationUserUpdated, 'data') === true && TypesConverter.hasProperty(onVerificationUserUpdated, 'isSuccess') === true) {
                                    if ( onVerificationUserUpdated.isSuccess === true ) {
                                        const data: CreateOnVerificationUserDto = { verificationToken };
                                        return this.generateCustomSuccessApiResultBase(data,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.userMessageCode,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.message,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.code,
                                        signInCommand.lang);
                                    } else {
                                        const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (onverification again), the service return an apiresultBase with error`;
                                        this.logger.error(msg);
                                        if (onVerificationUserUpdated.error != undefined && onVerificationUserUpdated.error != null) {
                                            return this.generateCustomErrorApiResultBase(onVerificationUserUpdated.error, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                        }
                                        // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                        // y el mensaje de aplicacion y error se usan los genericos
                                        return this.generateCustomErrorApiResultBase({ message: 'can not update user, the service return an apiresultBase with error'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                    }
                                } else { // es posible que el objeto devuelto sea un objeto tipo error/excepcion
                                    const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user, the service return a not apiresultBase`;
                                    this.logger.error(msg);
                                    // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                    // y el mensaje de aplicacion y error se usan los genericos
                                    return this.generateCustomErrorApiResultBase({ message: 'can not update user, the service return a not apiResultBase'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                }

                            } else { // Aqui no se pudo actualizar el usuario y se desconce el error fuente
                                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (onverification update again), the service return null`;
                                this.logger.error(msg);
                                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                // y el mensaje de aplicacion y error se usan los genericos
                                return this.generateCustomErrorApiResultBase({ message: 'can not update user (onverification update again), the service return null'}, OnVerificationUserUseCase.ERROR_USER_CAN_NOT_BE_UPDATED.userMessageCode, OnVerificationUserUseCase.ERROR_USER_CAN_NOT_BE_UPDATED.message, OnVerificationUserUseCase.ERROR_USER_CAN_NOT_BE_UPDATED.code, lang);
                            }
                        }
                    }
                }

            } else {
                // Notificar al usuario que no fue posible hacer el proceso de verificacion de cuenta, para ello se usa el
                // ERROR_USER_ACTIVATION, pero los mensajes de aplicacion, el codigo de resultado y el objeto error si se explican
                // y se logean para analizarlos
                const msg = `code:${OnSiginUserUseCase.ERROR_SENDING_EMAIL.code}, msg: ${OnSiginUserUseCase.ERROR_SENDING_EMAIL.message}, ex: The email api returns false`;
                this.logger.error(msg);
                console.log(msg);
                return this.generateCustomErrorApiResultBase(new AppInternalServerError('The email api returns false'), OnSiginUserUseCase.ERROR_SENDING_EMAIL.userMessageCode,
                OnSiginUserUseCase.ERROR_SENDING_EMAIL.message, OnSiginUserUseCase.ERROR_SENDING_EMAIL.code, signInCommand.lang);
            }
            } 
            else {
                return await this.generateCustomErrorApiResultBase(null,
                    OnVerificationUserUseCase.ERROR_NO_TEMPLATE_FOUND.userMessageCode,
                    OnVerificationUserUseCase.ERROR_NO_TEMPLATE_FOUND.message, OnVerificationUserUseCase.ERROR_NO_TEMPLATE_FOUND.code,  lang);
            }
            
        }

        } catch (exception) {
            if (this.instanceOfApiResulBaseDto(exception)) {
                return exception; } else {
                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: ${exception}`;
                this.logger.error(msg);
                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                // y el mensaje de aplicacion y error se usan los genericos
                return this.generateCustomErrorApiResultBase(exception, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
            }
        }

    }


    /**
     * Resolve the role of a user. Here is the logic
     * @param signInCommand 
     * @returns 
     */
    public calculateUserRolId(signInCommand: SignInCommand): Roles {
        try {

            if(signInCommand.ownerId == undefined || signInCommand.ownerId == null) return Roles.owner;
            return Roles.added;

        }
        catch(exception) {
            throw exception;
        }
    }


    /**
     * Verifica un token de activacion y tambien busca y verifica el usuario propietario del id que genero ese token
     * @param verificationToken token de verificacion
     */
    // private async verifyTokenAndAccount(verificationToken: any, returnUser: boolean = false): Promise<VerifyTokenAndAccountResult | User > {
    //     try {
    //             const verificationResult = await this.verifyToken(verificationToken);
    //             // Si el resultado de la verificacion es valida y contiene el id de la verification, se procede a obtener el
    //             // usuario con ese id
    //             if (verificationResult != null && verificationResult != undefined &&  TypesConverter.hasProperty(verificationResult, 'id')) {

    //             // Buscar a el usuario con el id de activiacion
    //             const pattern = { command: 'getByPropertyNameValue' };
    //             let userFound = null;
    //              // Se puede hacer la busqueda y actualizacion en una solo operacion por ejemplo usando una sola funcion
    //                 // por ejemplo findAndUpdate
    //             const getUserByActivatoinIdPayLoad = { propertyName: 'activationId', propertyValue: verificationResult.id, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };
    //                 // Se hace la llamada al servicio de usuarios para obtener el usuario
    //             userFound = await this.usersClient.send(pattern, getUserByActivatoinIdPayLoad).toPromise();
    //             if (userFound != null && userFound != undefined) {
    //                 if(returnUser === true) return userFound;

    //                 // Si el usuario esta en status verification
    //                 if (userFound.userStatus === UserStatus.OnVerification) {
    //                     return VerifyTokenAndAccountResult.TokenOKAndAccountOK;
    //                 }  else {
    //                     // El usuario no esta en estatus OnVerification
    //                     return VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus;
    //                 }
    //             } else {
    //                     return VerifyTokenAndAccountResult.TokenOKAndUndefinedUser;
    //                     // Si no existe el usuario, se debe estar alerta, porque el token recibido es posible que no haya sido generado por
    //                     // el sistema
    //             }
    //         }
    //         } catch (exception) {
    //         throw exception;
    //     }
    // }


     /**
      * Valida que un token de activacion de cuenta de usuario sea valida, ademas busca a el usuario que 
      * se uso para generar este token, si lo encuentra lo devuelve en el resultado
      * @param token Token a validar
      * @returns 
      */
     private async validateAccountFromToken(token: string): Promise<{user: User, result: VerifyTokenAndAccountResult}> {
        try {
                const tokenVerifcationResult = await this.verifyToken(token);
                
                // Si el resultado de la verificacion es valida (token valido) y contiene el id de la verification, se procede a obtener el
                // usuario con ese id
                if (tokenVerifcationResult != null && tokenVerifcationResult != undefined &&  TypesConverter.hasProperty(tokenVerifcationResult, 'id')) {

                // Buscar a el usuario con el id de activiacion
                const pattern = { command: 'getByPropertyNameValue' };
                
                 // Se puede hacer la busqueda y actualizacion en una solo operacion por ejemplo usando una sola funcion
                // por ejemplo findAndUpdate
                const getUserByActivationIdPayLoad = { propertyName: 'activationId', propertyValue: tokenVerifcationResult.id, propertyType: DataTypes.number, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };
                
                // Se hace la llamada al servicio de usuarios para obtener el usuario
                const userFound: User = (await this.usersClient.send(pattern, getUserByActivationIdPayLoad).toPromise());

                if (userFound != null && userFound != undefined) {
                    
                    // Si el usuario esta en status verification
                    if (userFound.userStatus === UserStatus.OnVerification) {
                        return { user: userFound, result: VerifyTokenAndAccountResult.TokenOKAndAccountInVerification };
                    }  
                    else {
                        
                        // El usuario no esta en estatus OnVerification
                        return { user: userFound, result: VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus };
                    }
                } else {
                        
                    // Si no existe el usuario, se debe estar alerta, porque el token recibido es posible que no haya sido generado por el sistema
                    return { user: null, result: VerifyTokenAndAccountResult.TokenOKAndUndefinedUser };
                }
            }
            } catch (exception) {
            throw exception;
        }
    }


    /**
     * Verify that a token is valid
     * @param token token as string
     */
    private async verifyToken(token: string) {
        try {
            if (token != null && token != undefined) {
                return await this.jwtService.verifyAsync(token);
            } else {
                throw new AppBadRequestException();
            }

        } catch (exception) {
            
            throw exception;
        }
    }


    /**
     * Verifica que el token sea valido / verify if the token is valid
     * @param verificationToken token para ser verificado/ token to be verified
     */
    // public async verify(verificationToken: string, lang: Langs = Langs.es_MX): Promise<ApiResultBaseDto> {
    //     try {

    //         // Se verifica la cuenta y el usuario
    //         const userOrVerifyResult = await this.verifyTokenAndAccount(verificationToken, true);
    //         if (this.isObjectWithUsernameProperty(userOrVerifyResult)) {
    //             // d
    //             return this.generateCustomSuccessApiResultBase({message: ApiResultBase.SUCCESS}, '', ApiResultBase.SUCCESS, ApiResultBase.SUCESS_CODE);
    //         } else {
    //             // El usuario no esta en modo verificacion y por lo tanto no se puede activar
    //             if ( userOrVerifyResult === VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus) {

    //                 return this.generateCustomErrorApiResultBase({message: VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.message}, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.userMessageCode, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.message, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.code);

    //             } else if (userOrVerifyResult === VerifyTokenAndAccountResult.TokenOKAndUndefinedUser) {
    //                 // Si se da este caso hay que tener cuidado ya que significa que no se encontro el usuario y puede ser
    //                 // que el token no se haya generado por el sistema
    //                 // const sendEmailCommand: SendEmailCommand = { body : 'Warning, a token was received and not user was found', isBodyHtml: false, lang: Langs.es_MX, tos: [], subject: 'Warning' };
    //                 // this.sendEmail();
    //                 return this.generateCustomErrorApiResultBase({message: VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.message }, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.userMessageCode, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.message, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.code);
    //             } else {
    //                 // Error desconocido
    //                 return this.generateCustomErrorApiResultBase({message: VerifyAccountUseCase.ERROR_UNKNOW_ERROR.message }, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.userMessageCode, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.message, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.code);
    //             }
    //         }

    //     } catch (exception) {
    //         if (exception) {
    //             if (TypesConverter.hasProperty(exception, 'name')) {
    //                 switch (exception.name) {
    //                     case 'TokenExpiredError': return this.generateCustomErrorApiResultBase(exception, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.userMessageCode, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.message, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.code);
    //                     default: return this.generateCustomErrorApiResultBase(exception, '', '', ApiResultBase.ERROR_CODE);
    //                 }
    //             }
    //         } else {
    //             return this.generateCustomErrorApiResultBase({message: 'Error: no exception throwed'}, '', '', ApiResultBase.ERROR_CODE);
    //         }
    //     }
    // }


    /**
     * Activa un usuario que previamente se habia registrado para activacion. Recibe como parametros el token de verificacion para que
     * despues de verificarlo busque a el usuario con su respectivo id. El parametro lang es opcional y especifica el lenguaje que esta
     * usando el programa cliente y con base en ese lenguaje se envia la respuesta en ese lenguaje
     * @param verificationToken token de verificación
     * @param lang lenguaje
     */
    public async activate(verificationToken: string, lang: Langs = Langs.es_MX): Promise<ApiResultBaseDto> {
        try {

            const accountFromTokenValidation = await this.validateAccountFromToken(verificationToken);

            if (accountFromTokenValidation.user !== null && accountFromTokenValidation.result === VerifyTokenAndAccountResult.TokenOKAndAccountInVerification) {
                
                const username = accountFromTokenValidation.user.username;
                const pattern = { command: 'update' };
                const updatePayload = { username, systemId: this.appConfigService.getSystemId(), update: { userStatus: UserStatus.Activated }, callSource: CallSources.Microservice };
                const operationalUserUpdated = await this.usersClient.send<ApiResultBaseDto>(pattern, updatePayload).toPromise();
                if (operationalUserUpdated != null && operationalUserUpdated != undefined) {
                    //Se crea el grupo default de vehiculos        
                    const vehicleGroup: VehicleGroup = new VehicleGroup('default', accountFromTokenValidation.user._id, 1);
                    const vehicleGroupsaved = await this.vehicleGroupRepository.save(vehicleGroup);
                            
                    // El usuario se activa y se retorna
                    return this.generateCustomSuccessApiResultBase({message: ActivateAccountUseCase.SUCCESS_USER_ACTIVATED.message}, ActivateAccountUseCase.SUCCESS_USER_ACTIVATED.userMessageCode, ActivateAccountUseCase.SUCCESS_USER_ACTIVATED.message, ActivateAccountUseCase.SUCCESS_USER_ACTIVATED.code, lang);
                        } else {
                            // No se pudo actualizar el usuario
                            return this.generateCustomErrorApiResultBase({message: ActivateAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.message }, ActivateAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.userMessageCode, ActivateAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.message, ActivateAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.code);
                        }

            } else {

                // El usuario no esta en modo verificacion y por lo tanto no se puede activar
                if ( accountFromTokenValidation.result === VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus) {
                    
                    return this.generateCustomErrorApiResultBase({message: ActivateAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.message }, ActivateAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.userMessageCode, ActivateAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.message, ActivateAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.code, lang);

                } else if (accountFromTokenValidation.result === VerifyTokenAndAccountResult.TokenOKAndUndefinedUser) {
                    // Si se da este caso hay que tener cuidado ya que significa que no se encontro el usuario y puede ser
                    // que el token no se haya generado por el sistema
                    // const sendEmailCommand: SendEmailCommand = { body : 'Warning, a token was received and not user was found', isBodyHtml: false, lang: Langs.es_MX, tos: [], subject: 'Warning' };
                    // this.sendEmail();
                    return this.generateCustomErrorApiResultBase({message: ActivateAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.message }, ActivateAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.userMessageCode, ActivateAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.message, ActivateAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.code, lang);
                } else {
                    return this.generateCustomErrorApiResultBase({message: ActivateAccountUseCase.ERROR_UNKNOW_ERROR.message }, ActivateAccountUseCase.ERROR_UNKNOW_ERROR.userMessageCode, ActivateAccountUseCase.ERROR_UNKNOW_ERROR.message, ActivateAccountUseCase.ERROR_UNKNOW_ERROR.code, lang);
                }
            }

        } catch (exception) {
            if (exception !== null && exception != undefined) {
                if (TypesConverter.hasProperty(exception, 'name')) {
                    switch (exception.name) {
                        case 'TokenExpiredError': return this.generateCustomErrorApiResultBase(exception, ActivateAccountUseCase.ERROR_EXPIRED_TOKEN.userMessageCode, ActivateAccountUseCase.ERROR_EXPIRED_TOKEN.message, ActivateAccountUseCase.ERROR_EXPIRED_TOKEN.code, lang);
                        default: 
                            return this.generateCustomErrorApiResultBase(exception, ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, lang);
                    }
                } else  {
                    return this.generateCustomErrorApiResultBase(exception, ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, lang);
                }
            } else {
                
                const error = new AppInternalServerError(); error.Message = "Unknow error on activation";
                return this.generateCustomErrorApiResultBase(error, ApiResultBase.UM_ERROR, ApiResultBase.AM_INTERNAL_ERROR, ApiResultBase.ERROR_CODE, lang);
            }
        }
    }


    /**
     *
     * @param payload
     * @param signOptions
     */
    public async generateToken(payload: any, signOptions: SignOptions): Promise<string> {

        return await this.jwtService.signAsync(payload, signOptions);
    }



    /**
     * Gets a refresh token.
     * @param refreshToken refresh token string
     */
    public async getRefreshToken(refreshToken: string): Promise<RefreshToken> {

        try {

            const refreshTokenFilter = { token: refreshToken };
            const refreshTokenFound: RefreshToken = await this.refreshTokenRepository.getOneByFilter(refreshTokenFilter);
            return !refreshTokenFound || !refreshTokenFound.isValid ? null: refreshTokenFound;
        }
        catch(exception) {

            throw exception;
        }

    }

    /**
     * Generates a refresh token entity
     * @param userId user id
     * @param ip ip
     * @returns 
     */
    public async generateRefreshToken(userId: string, ip: string, saveRefreshToken: boolean): Promise<RefreshToken> {
        try {

            const randomString = crypto.randomBytes(RANDOM_STRING_BUFFER_SIZE).toString('hex');
            const expirationDelta = (this.appConfigService.refreshTokenOptions.expiresInDays * HOURS_IN_A_DAY * MINUTES_IN_A_HOUR * SECONDS_IN_A_MINUTE * MILISECONDS_IN_A_SECOND);
            const expiration = new Date(Date.now() + expirationDelta);
            const refreshToken: RefreshToken = new RefreshToken(userId, randomString, expiration, ip);
            if(saveRefreshToken === true) {
             const savedRefreshToken = await this.refreshTokenRepository.save(refreshToken);
            }
            return refreshToken;
        }
        catch(exception) {
            throw exception;
        }
    }


    /**
     * Updates a refresh token
     * @param filter filter to find the refresh token
     * @param updatePart Part of the object to be updated
     * @returns 
     */
    public async updateRefreshToken(filter: any, updatePart: any): Promise<RefreshToken> {

        return this.refreshTokenRepository.update(filter, updatePart, true);

    }


    /**
     * Envia un correo electronico usando el servicio de infraestructura
     * @param sendEmailCommand comando para enviar un correo
     */
    private sendEmail(sendEmailCommand: SendEmailCommand): Observable<boolean> {

        const pattern = { command: 'emails/MicroserviceSend' };
        return from(this.messagesRepository.getMessageByLanguageAndCode(sendEmailCommand.lang, sendEmailCommand.subjectCode))
        .pipe( concatMap( (subjectMessage: Message) =>  {
            const subject = subjectMessage != null && subjectMessage != undefined ? subjectMessage.value : sendEmailCommand.subjectCode;
            const emailPayload = sendEmailCommand;
            emailPayload.subject = subject;
            return this.infrastructureClient.send<boolean>(pattern, emailPayload).pipe(map( wasSend => TypesConverter.convertToBoolean(String(wasSend))));
        }), catchError(err => throwError(err)));
    }


    /**
     * Envia un sms
     * @param sendSMSCommand Comando para enviar un sms
     */
    public sendSMS(sendSMSCommand: SendSMSCommand): Observable<ApiResultBaseDto> {
        const pattern = { command: 'sms/MicroserviceSend' };
        const payLoad = sendSMSCommand;
        return this.infrastructureClient.send<any>(pattern, payLoad)
        .pipe(catchError(err => throwError(err)));
    }

    /**
     * 
     * @param logger 
     * @param code 
     * @param message 
     * @param error 
     */
    private log(logger: Logger, code: number, message: string, error?: any) {

        const msg = `code: ${code}, msg: ${message}, err: ${error}`;
        this.logger.error(msg);
    }


    /**
     * 
     * @param port 
     * @param forwardPort 
     * @param messageType 
     */
    public RunTcpServer(port: number, forwardPort: number, messageType: number): Observable<any> {
        const pattern = { command: 'Net/RunTcpServer' };
        const payload: RunTcpServerCommand = { port, forwardPort, messageType };
        return this.infrastructureClient.send<any>(pattern, payload)
        .pipe(catchError( error => { throw error; } ));
    }

    // Devices
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Obtiene los paises
     */
    public async getCountries(): Promise<ApiResultBaseDto>  {

        const countriesDto: CountryDto[] = (await this.countriesRepository.getAll())
        .map(country => {
            const countryDto: CountryDto = { name: country.name, phoneCode: country.phoneCode, countryId: country.countryId.toString() };
            return countryDto;
        });

        // const countries: Country[] = [{ name: 'México', phoneCode: '52', display: 'Mexico' }, { name: 'United States', phoneCode: '1', display: 'United States' }];
        return this.generateCustomSuccessApiResultBase(countriesDto, '', ApiResultBase.SUCCESS, ApiResultBase.SUCCESS_CODE);

    }

    
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////


    instanceOfApiResulBaseDto(object: any): object is ApiResultBaseDto {
        return 'data' in object &&
        'error' in object &&
        'isSucess' in object &&
        'applicationMessage' in object &&
        'userMessage' in object &&
        'token' in object &&
        'resultCode' in object;
    }
    

    /**
     * Procesa los datos tcp retransmitidos por el servidor (el que se configuro para escuchar los mensajes previamente)
     * El procesamiento consiste en obtener las coordenadas latitud y longitud, velocidad e imei del dispositivo
     * El formato que se espera es imei latitud longitud velocidad
     * @param data Cadena que contiene la representacion en string de los datos de los bytes enviador por el cliente tcp.
     * La codificacion de esta cadena debe ser base64
     */
    public async processTcpDataAndSendToWebClients(data: string) {
        
        // Se obtiene el buffer de bytes a partir de la cadena data
        let dataBuffer: Buffer = buffer.Buffer.from(data, 'base64' );
        let imei = this.getDoubleFromByteArray(data, 0, 8, 'base64', true);
        
        let sensingDevice: ISensingCurrentDevice;
        if(this.sensingCurrentDevices[imei] !== undefined)
        {
            sensingDevice = this.sensingCurrentDevices[imei];
        }
        else
        {   
            // En caso de que no se encuentre el dispositivo en la memoria cache, se obtiene desde la base de datos
            const device = (await this.devicesApplication.getDeviceByImei(imei.toString()));            
            
            sensingDevice = { device, lastSensingDate: Date.now()} ;
            
            this.sensingCurrentDevices[imei] = sensingDevice;
        }
        
        // Gets the last owner id of the device
        const lastOwnerId = await sensingDevice.device.getLastOwnerId();
        
        //We are going to get the owner id and the tokens of the users that belongs
        // to the ownerId
        // Para obtener el usuario primero se obtiene su token
        const usersTokens = this.ownerIdUsersToKens[lastOwnerId];
        // we iterate over every key in the object, every key is a token
        //of every user that belongs to the owner id
        for (const token in usersTokens) {
            const email   = this.authenticatedUsers[token].username;
            const socket = this.authenticatedUsers[token].socketClient;

            // Aqui se debe obtener/calcular el statusId del dispositivo
        const statusId = 1;
        let location: ITrackingLocation = { imei, email, statusId };
        
        if(dataBuffer.length > MIN_TCP_DATA_LENGTH) {

            let operationType   = this.getByteFromByteArray(data, 8, 9, 'base64', true);
            let latitude        = this.getDoubleFromByteArray(data, 9, 17, 'base64', true);
            let longitude       = this.getDoubleFromByteArray(data, 17, 25, 'base64', true);
            let speed           = this.getFloatFromByteArray(data, 25, 29, 'base64', true);
            location = { imei, latitude, longitude, speed, email, statusId };
        }

            const socketLocation : ISocketLocation = { location, socket: socket };
            this.locationsEmitter.next(socketLocation);
          }
        
}

    /**
     * 
     * @param data Buffer de datos original (byte array)
     * @param start Indice desde donde se inicia y se toma en cuenta para convertir el arreglo a numero
     * @param end Indice donde termina y no se toma en cuenta (no inclusivo) para convertir el arreglo a numero
     * @param dataCoding Indica el formato de codificacion en la que esta la cadena
     * @param isBigEndian Indica el formato en que se obtendran el numero de la cadena, puede ser BingEndian o LittleEndian vea https://en.wikipedia.org/wiki/Endianness
     */
    private getDoubleFromByteArray(data: string, start: number, end: number, dataCoding: BufferEncoding = 'base64', isBigEndian: boolean = true ): number {

        let dataBuffer: Buffer = buffer.Buffer.from(data, dataCoding);
        let dataSubBuffer = dataBuffer.slice(start, end);
        if(isBigEndian == true)
        {
            return dataSubBuffer.readDoubleBE(0);
        }
        else
        {
            return dataSubBuffer.readDoubleLE(0);
        }

    }


    /**
     * 
     * @param data Buffer de datos original (byte array)
     * @param start Indice desde donde se inicia y se toma en cuenta para convertir el arreglo a numero
     * @param end Indice donde termina y no se toma en cuenta (no inclusivo) para convertir el arreglo a numero
     * @param dataCoding 
     * @param isBigEndian 
     */
    private getFloatFromByteArray(data: string, start: number, end: number, dataCoding: BufferEncoding = 'base64', isBigEndian: boolean = true ): number {

        let dataBuffer: Buffer = buffer.Buffer.from(data, dataCoding);
        let dataSubBuffer = dataBuffer.slice(start, end);
        if(isBigEndian == true)
        {
            return dataSubBuffer.readFloatBE(0);
        }
        else
        {
            return dataSubBuffer.readFloatLE(0);
        }

    }

    /**
     * 
     * @param data 
     * @param start 
     * @param end 
     * @param dataCoding 
     * @param isBigEndian 
     */
    private getByteFromByteArray(data: string, start: number, end: number, dataCoding: BufferEncoding = 'base64', isBigEndian: boolean = true ): number {

        let dataBuffer: Buffer = buffer.Buffer.from(data, dataCoding);
        let dataSubBuffer = dataBuffer.slice(start, end);
        if(isBigEndian == true)
        {
            return dataSubBuffer.readInt8(0)
        }
        else
        {
            return dataSubBuffer.readInt8(0)
        }

    }

    
    
    /**
     * Agrega un usuario a la cache de usuarios autenticados
     * @param username 
     * @param token 
     */
    public addAuthenticatedUsers(username: string, userId: string, token: string, ownerId: string): boolean {
        
        let authenticatedUser: AuthenticatedUser;
        if(this.authenticatedUsers[token] !== undefined ) {
            authenticatedUser = this.authenticatedUsers[token];
            authenticatedUser.loginCount++;
        } else {

            this.authenticatedUsers[token] = { devices: [], loginCount: 1, username, id: userId };
            authenticatedUser = this.authenticatedUsers[token];
        }
        
        const solvedOwnerId = ownerId !== null? ownerId: userId;

        let tokens: any;
        if(this.ownerIdUsersToKens[solvedOwnerId] === undefined)
        {
            tokens = { };
            tokens[token] = true;
        }
        else
        {
            tokens = this.ownerIdUsersToKens[solvedOwnerId]
            tokens[token] = true;
        }

        this.ownerIdUsersToKens[solvedOwnerId] = tokens;
        return true;
    }


    /**
     * Obtiene un usuario autenticado de la cache
     * @param token Token para obtener el usuario
     */
    public getAuthenticatedUser(token: string) {
        return this.authenticatedUsers[token];
    }


    /**
     * Agrega un socket (cliente socket) a un usuario autenticado. Esto puede sucede cuando el client websocket
     * de la aplicacion web se conecta al servidor webSocket, por lo tanto se tiene que relacionar el socket
     * cliente al usuario autenticado, es decir, saber a que usuario autenticado corresponde el client socket
     * que se acaba de conectar
     * @param socket socket cliente
     * @param token token del usuario autenticado
     */
    public attachSocketToAuthenticatedToUser(token: string, socket: Socket) {
        if(this.authenticatedUsers[token] !== undefined ) {
            const authenticatedUser = this.authenticatedUsers[token];
            authenticatedUser.socketClient = socket;
        }
    }


    /**
     * Gets the brands with their models within
     * @param properties 
     * @returns 
     */
    public async getBrandsWithModel(properties: Array<{ name: string, value: string }>): Promise<ApiResultBaseDto> {
        try {
        
            const filter = {};
            const brandModel: BrandModel = new BrandModel();
            
            // Here we define the allowed properties that can be used to query the entities
            // its important that at the constructor of the model we set this properties to a 
            //initial value
            const props:(keyof BrandModel)[] = [ 'visible', 'enabled' ];
            for(let i = 0; i < properties.length; i++) {
                const propertyName = props.filter(item => item === properties[i].name)[0];
                if(propertyName !== undefined) {
                    filter[properties[i].name] = this.fromStringToPrimitive(typeof brandModel[propertyName], properties[i].value);
                }
                else {
                    throw new AppBadRequestException();
                }
            }

            const brands = await this.brandsRepository.getWithModels(filter);
            
            const brandsDtos: BrandDto[] = brands.map(brand => {
                const brandDto: BrandDto = { id: brand.id, name: brand.displayName, order: brand.order, models: brand.models.map(model => {
                    const brandModelDto: BrandModelDto = {
                        id: model.id,
                        name: model.displayName, order: model.order
                    };
                    return brandModelDto;
                }) };
                return brandDto;
              });
              
              return this.generateSuccessApiResultBase(brandsDtos, ApiResultBase.SUCCESS, ApiResultBase.SUCCESS_CODE, null, ApiResultBase.SUCCESS, null);
    }
        catch(error) {
            throw error;
        }
        
    }

}
