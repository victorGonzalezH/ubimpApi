import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { Subject, Observable, throwError, from } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { ITrackingLocation } from './dataTransferObjects/socketio/itrackingLocation.model';
import { ClientProxy } from '@nestjs/microservices';
import { SignInCommand } from './services/auth/signIn.command';
import { AppConfigService } from './config/appConfig.service';
import { MessagesRepositoryService } from '@ubi/ubimp.infrastructure/persistence/messages.repository.service';
import { TemplatesManager } from './services/templates/templatesManager.service';
import { TemplatesTypes } from './services/templates/templatesTypes.enum';
import { Message } from '@ubd/ubimp.domain';
import { JwtService } from '@nestjs/jwt';
import { CreateOnVerificationUserCommand } from './usecases/CreateOnVerificationUser/createOnVerficationUser.command';
import * as bcrypt from 'bcrypt';
import { UserTypes } from './usecases/CreateOnVerificationUser/userTypes.enum';
import { CallSources } from './enums/callSouces.enum';
import { UserStatus } from './usecases/CreateOnVerificationUser/userStatus.enum';
import { SignOptions } from 'jsonwebtoken';
import { OnVerificationUserUseCase } from './usecases/CreateOnVerificationUser/onVerificationUserUseCase.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ApiResultBase } from 'utils/dist/application/dataTransferObjects/apiResultBase.model';
import { EnvironmentTypes } from 'utils/dist/application/Enums/environmentTypes.enum';
import { ApplicationMessagesManager } from './services/applicationMessages/applicationMessagesManager.service';
import { SendEmailCommand } from './commands/sendEmail.command';
import { CreateOnVerificationUserDto } from './usecases/CreateOnVerificationUser/createOnVerificationUser.dto';
import { exception } from 'console';
import { TypesConverter } from 'utils/dist/shared/typesConverter';
import { VerifyAccountUseCase } from './usecases/verifyAccount/verifyAccountUseCase.service';
import { AppBadRequestException, Langs } from 'utils';
import { VerifyTokenAndAccountResult } from './usecases/verifyAccount/verifyTokenAndAccountResult.enum';

@Injectable()
export class UbimpApplicationService {

     /**
     * 
     */
    private socketioEmitterSubject: Subject<ITrackingLocation>;

    /**
     * 
     */
    get socketioEmitter(): Observable<ITrackingLocation> {
        return this.socketioEmitterSubject.asObservable();
    }


    constructor(@Inject('INFRASTRUCTURE_SERVICE') private infrastructureClient: ClientProxy,
                @Inject('USERS_SERVICE') private usersClient: ClientProxy,
                @Inject('TEMPLATES_SERVICE') private templatesManager: TemplatesManager,
                private jwtService: JwtService,
                private appConfigService: AppConfigService,
                private messagesRepository: MessagesRepositoryService,
                @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
        this.socketioEmitterSubject = new Subject<ITrackingLocation>();

    }


    /**
     * 
     * @param rawData 
     */
    public recieveTcpData(rawData: any) {

    }

    private isObjectWithUsernameProperty(objectWithUsernameProperty: VerifyTokenAndAccountResult | { username: string }): objectWithUsernameProperty is { username: string } {
        return (objectWithUsernameProperty as { username: string }).username !== undefined;
      }

    /**
     * Guarda un usuario, se contruye la plantilla de activacion y se envia el correo de activacion al usuario
     * @param signInCommand
     */
    public async addUserAndSendActivationEmail(signInCommand: SignInCommand): Promise<ApiResultBase> {

        try {
            // Si el comando no especifica un lenguaje, entonces, se asigna el lenguaje predeterminado que usa la aplicacion
            if (signInCommand.lang == null || signInCommand == undefined ) {
                signInCommand.lang = this.appConfigService.getDefaultLanguage();
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
                const msg = `code: ${ApplicationMessagesManager.ERROR_GET_USER.code}, msg: ${ApplicationMessagesManager.ERROR_GET_USER.message}, ex: ${exception}`;
                this.logger.error(msg);
                return await this.generateErrorApiResultBase( exception, 'ERROR_USER_ACTIVATION', ApplicationMessagesManager.ERROR_GET_USER.message, ApplicationMessagesManager.ERROR_GET_USER.code, signInCommand.lang);
            }

            if (userFound != null && userFound != undefined && userFound.userStatus != undefined && userFound.userStatus === UserStatus.Blacklisted) {
                // Inform to the user
                return await this.generateErrorApiResultBase( null,
                    OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.message,
                    OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.message, OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.code,  signInCommand.lang);

            } else  {

            const activationId = Date.now(); // Se usa la hora y la fecha actual (now) para el id de activacion
            const verificationToken = await this.generateToken({ id: activationId.toString() }, this.appConfigService.activationTokenOptions);

            // Se genera la url para verificar la cuenta
            const urlVerify: string = `${this.appConfigService.currentHost}${OnVerificationUserUseCase.VERIFY_URL_PATH}/${verificationToken}`;

            // Se obtiene la plantilla de activacion de cuenta y se reemplaza el nomobre del usuario que se desea registrarse
            const sourceTemplate = await this.templatesManager.getTemplate(OnVerificationUserUseCase.verificationUserTemplate.code, signInCommand.lang, OnVerificationUserUseCase.verificationUserTemplate.type);
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
                const msg = `code:${ApplicationMessagesManager.ERROR_SENDING_EMAIL.code}, msg: ${ApplicationMessagesManager.ERROR_SENDING_EMAIL.message}, ex: ${exception}`;
                this.logger.error(msg);
                return this.generateErrorApiResultBase(exception, 'ERROR_USER_ACTIVATION', ApplicationMessagesManager.ERROR_SENDING_EMAIL.message, ApplicationMessagesManager.ERROR_SENDING_EMAIL.code, signInCommand.lang);
            }

             // Si el correo fue enviado con exito
            if (wasSendIt === true) {
                // Si el usuario no existe
                if (userFound == null || userFound == undefined) {

                    // Se obtiene un "salt" que es necesario para la generacion del hash
                    const salt = bcrypt.genSaltSync(this.appConfigService.passwordSaltRounds);
                    // se hace el hashing de la contrasena
                    const securePassword = bcrypt.hashSync(signInCommand.password,  salt);

                    //
                    pattern = { command: 'save' };
                    // Se crea el comando para crear el usuario Todos los usuarios que se crean por primera vez se crean con estado
                    // OnVerification
                    const userPayload = { saveUserCommand: CreateOnVerificationUserCommand.createCommand(signInCommand.username, securePassword, signInCommand.name,
                        signInCommand.lastName, signInCommand.secondLastName, this.appConfigService.getSystemId(), UserTypes.Owner, activationId)};

                    try {
                        // Se hace la llamada al servicio de usuarios para crearlo
                        const onVerificationUser = await this.usersClient.send(pattern, userPayload).toPromise();
                        if (onVerificationUser != null && onVerificationUser != undefined) {
                            const data: CreateOnVerificationUserDto = { verificationToken };
                            return this.generateSuccessApiResultBase(data,
                                OnVerificationUserUseCase.SUCCESS_ON_VERIFICATION_USER.message,
                                OnVerificationUserUseCase.SUCCESS_ON_VERIFICATION_USER.message,
                                OnVerificationUserUseCase.SUCCESS_ON_VERIFICATION_USER.code,
                                signInCommand.lang);
                        } else {
                            const msg = `code:${ApplicationMessagesManager.ERROR_CREATE_USER.code}, msg: ${ApplicationMessagesManager.ERROR_CREATE_USER.message}, ex: ${exception}`;
                            this.logger.error(msg);
                            return this.generateErrorApiResultBase(exception, 'ERROR_CREATE_USER', ApplicationMessagesManager.ERROR_CREATE_USER.message, ApplicationMessagesManager.ERROR_CREATE_USER.code, signInCommand.lang);
                        }
                    } catch (exception) {
                        const msg = `code:${ApplicationMessagesManager.ERROR_CREATE_USER.code}, msg: ${ApplicationMessagesManager.ERROR_CREATE_USER.message}, ex: ${exception}`;
                        this.logger.error(msg);
                        return this.generateErrorApiResultBase(exception, 'ERROR_CREATE_USER', ApplicationMessagesManager.ERROR_CREATE_USER.message, ApplicationMessagesManager.ERROR_CREATE_USER.code, signInCommand.lang);
                    }

                } else { // Si si existe, y se encuentra en verificacion, se tiene que actualizar los intentos de
                        // actualizacion
                        pattern = { command: 'update' };
                        if (userFound.userStatus === UserStatus.OnVerification ) {
                        if (userFound.activationAttempts + 1 > 3) {
                            // Blacklistear al usuario pues ya sobrepaso los intentos de verificacion de cuenta
                            const updatePayload = { username: signInCommand.username, systemId: this.appConfigService.getSystemId(), update: { userStatus: UserStatus.Blacklisted }, callSource: CallSources.Microservice };
                            const blacklistedUserUpdated = await this.usersClient.send<ApiResultBase>(pattern, updatePayload).toPromise();
                            if (blacklistedUserUpdated != null && blacklistedUserUpdated != undefined) {
                                if (TypesConverter.hasProperty(blacklistedUserUpdated, 'data') === true && TypesConverter.hasProperty(blacklistedUserUpdated, 'isSuccess') === true) {
                                    if ( blacklistedUserUpdated.isSuccess === true ) {
                                        const data: CreateOnVerificationUserDto = { verificationToken };
                                        return this.generateErrorApiResultBase({},
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.userMessageCode,
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.message,
                                        OnVerificationUserUseCase.ERROR_BLACK_LISTED_USER.code,
                                        signInCommand.lang);
                                    } else {
                                        const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (blacklisted), the service return an apiresultBase with error`;
                                        this.logger.error(msg);
                                        if (blacklistedUserUpdated.error != undefined && blacklistedUserUpdated.error != null) {
                                            return this.generateErrorApiResultBase(blacklistedUserUpdated.error, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                        }
                                        // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                        // y el mensaje de aplicacion y error se usan los genericos
                                        return this.generateErrorApiResultBase({ message: 'can not update user, the service return an apiresultBase with error'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                    }

                                } else {
                                    const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user, the service return a not apiresultBase`;
                                    this.logger.error(msg);
                                    // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                    // y el mensaje de aplicacion y error se usan los genericos
                                    return this.generateErrorApiResultBase({ message: 'can not update user, the service return a not apiResultBase'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                }
                            } else {
                                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (blacklisted), the service return null`;
                                this.logger.error(msg);
                                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                // y el mensaje de aplicacion y error se usan los genericos
                                return this.generateErrorApiResultBase({message: 'can not update user (blacklisted), the service return null'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                            }
                        } else {

                            const updatePayload = { username: signInCommand.username, systemId: this.appConfigService.getSystemId(), update: { activationAttempts: userFound.activationAttempts + 1, activationId: activationId }, callSource: CallSources.Microservice };
                            const onVerificationUserUpdated = await this.usersClient.send<ApiResultBase>(pattern, updatePayload).toPromise();

                            if (onVerificationUserUpdated != null && onVerificationUserUpdated != undefined) {
                                // Se verifica si el objeto onVerificationUserUpdated es un objeto de tipo ApiResultBase
                                // par ello, preguntamos
                                if (TypesConverter.hasProperty(onVerificationUserUpdated, 'data') === true && TypesConverter.hasProperty(onVerificationUserUpdated, 'isSuccess') === true) {
                                    if ( onVerificationUserUpdated.isSuccess === true ) {
                                        const data: CreateOnVerificationUserDto = { verificationToken };
                                        return this.generateSuccessApiResultBase(data,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.userMessageCode,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.message,
                                        OnVerificationUserUseCase.WARNING_ON_VERIFICATION_USER_ATEMPT.code,
                                        signInCommand.lang);
                                    } else {
                                        const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (onverification again), the service return an apiresultBase with error`;
                                        this.logger.error(msg);
                                        if (onVerificationUserUpdated.error != undefined && onVerificationUserUpdated.error != null) {
                                            return this.generateErrorApiResultBase(onVerificationUserUpdated.error, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                        }
                                        // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                        // y el mensaje de aplicacion y error se usan los genericos
                                        return this.generateErrorApiResultBase({ message: 'can not update user, the service return an apiresultBase with error'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                    }
                                } else { // es posible que el objeto devuelto sea un objeto tipo error/excepcion
                                    const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user, the service return a not apiresultBase`;
                                    this.logger.error(msg);
                                    // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                    // y el mensaje de aplicacion y error se usan los genericos
                                    return this.generateErrorApiResultBase({ message: 'can not update user, the service return a not apiResultBase'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                                }

                            } else { // Aqui no se pudo actualizar el usuario y se desconce el error fuente
                                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: can not update user (onverification update again), the service return null`;
                                this.logger.error(msg);
                                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                                // y el mensaje de aplicacion y error se usan los genericos
                                return this.generateErrorApiResultBase({message: 'can not update user (onverification update again), the service return null'}, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
                            }
                        }
                    }
                }

            } else {
                // Notificar al usuario que no fue posible hacer el proceso de verificacion de cuenta, para ello se usa el
                // ERROR_USER_ACTIVATION, pero los mensajes de aplicacion, el codigo de resultado y el objeto error si se explican
                // y se logean para analizarlos
                const msg = `code:${ApplicationMessagesManager.ERROR_SENDING_EMAIL.code}, msg: ${ApplicationMessagesManager.ERROR_SENDING_EMAIL.message}, ex: The email api returns false`;
                this.logger.error(msg);
                return this.generateErrorApiResultBase('The email api returns false', 'ERROR_USER_ACTIVATION',
                ApplicationMessagesManager.ERROR_SENDING_EMAIL.message, ApplicationMessagesManager.ERROR_SENDING_EMAIL.code, signInCommand.lang);
            }
        }

        } catch (exception) {
            if (exception instanceof ApiResultBase ) {
                return exception; } else {
                const msg = `code:${0}, msg: ${ApiResultBase.ERROR}, ex: ${exception}`;
                this.logger.error(msg);
                // Como aqui se desconoce el tipo de error, se usa el 'ERROR_USER_ACTIVATION' para informar al usuario
                // y el mensaje de aplicacion y error se usan los genericos
                return this.generateErrorApiResultBase(exception, 'ERROR_USER_ACTIVATION', ApiResultBase.ERROR, -1, signInCommand.lang);
            }
        }

    }


    /**
     * Verifica un token de activiacion y tambien busca y verifica el usuario propietario del id que genero ese token
     * @param verificationToken token de verificacion
     */
    private async verifyTokenAndAccount(verificationToken: any): Promise<VerifyTokenAndAccountResult | { username: string }> {
        try {
                const verificationResult = await this.verifyToken(verificationToken);
                // Si el resultado de la verificacion es valida y contiene el id de la verification, se procede a obtener el 
                // usuario con ese id
                if (verificationResult != null && verificationResult != undefined &&  TypesConverter.hasProperty(verificationResult, 'id')) {

                // Buscar a el usuario con el id de activiacion
                const pattern = { command: 'getByPropertyNameValue' };
                let userFound = null;
                 // Se puede hacer la busqueda y actualizacion en una solo operacion por ejemplo usando una sola funcion
                    // por ejemplo findAndUpdate
                const getUserByActivatoinIdPayLoad = { propertyName: 'activationId', propertyValue: verificationResult.id, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };
                    // Se hace la llamada al servicio de usuarios para obtener el usuario
                userFound = await this.usersClient.send(pattern, getUserByActivatoinIdPayLoad).toPromise();

                if (userFound != null && userFound != undefined) {
                    // Si el usuario esta en status verification
                    if (userFound.userStatus === UserStatus.OnVerification) {
                        return userFound;
                    }  else {
                        return VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus; // El usuario no esta en estatus OnVerification
                    }
                } else {
                        return VerifyTokenAndAccountResult.TokenOKAndUndefinedUser;
                        // Si no existe el usuario, se debe estar alerta, porque el token recibido es posible que no haya sido generado por
                        // el sistema
                }
            }
            } catch (exception) {
            throw exception;
        }
    }



    /**
     * 
     * @param token 
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
    public async verify(verificationToken: string, lang: Langs = Langs.es_MX): Promise<ApiResultBase> {
        try {
            const verificationResult = await this.verifyToken(verificationToken);
            if (verificationResult != null && verificationResult != undefined &&  TypesConverter.hasProperty(verificationResult, 'id')) {
                // d
            }
            return this.generateSuccessApiResultBase({message: ApiResultBase.SUCCESS}, '', ApiResultBase.SUCCESS, ApiResultBase.SUCESS_CODE);

        } catch (exception) {
            if (exception) {
                if (TypesConverter.hasProperty(exception, 'name')) {
                    switch (exception.name) {
                        case 'TokenExpiredError': return this.generateErrorApiResultBase(exception, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.userMessageCode, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.message, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.code);
                        default: return this.generateErrorApiResultBase(exception, '', '', ApiResultBase.ERROR_CODE);
                    }
                }
            } else {
                return this.generateErrorApiResultBase({message: 'Error: no exception throwed'}, '', '', ApiResultBase.ERROR_CODE);
            }
        }
    }

    /**
     * Activa un usuario que previamente se habia registrado para activacion. Recibe como parametros el token de verificacion para que
     * despues de verificarlo busque a el usuario con su respectivo id. El parametro lang es opcional y especifica el lenguaje que esta
     * usando el programa cliente y con base en ese lenguaje se envia la respuesta en ese lenguaje
     * @param verificationToken token de verificación
     * @param lang lenguaje
     */
    public async activate(verificationToken: string, lang: Langs = Langs.es_MX): Promise<ApiResultBase> {
        try {

            const userOrVerifyResult = await this.verifyTokenAndAccount(verificationToken);
            if (this.isObjectWithUsernameProperty(userOrVerifyResult)) {
                const username = userOrVerifyResult.username;
                // Si el token es correcto y el usuario es correcto
                if (await this.verifyTokenAndAccount(verificationToken) === VerifyTokenAndAccountResult.TokenOKAndAccountOK) {
                    const pattern = { command: 'update' };
                    const updatePayload = { username, systemId: this.appConfigService.getSystemId(), update: { userStatus: UserStatus.Activated }, callSource: CallSources.Microservice };
                    const operationalUserUpdated = await this.usersClient.send<ApiResultBase>(pattern, updatePayload).toPromise();
                    if (operationalUserUpdated != null && operationalUserUpdated != undefined) {
                                // El usuario se activa y se retorna
                                return this.generateSuccessApiResultBase({message: ''}, '', ApiResultBase.SUCCESS, ApiResultBase.SUCESS_CODE, lang);
                            } else {
                                    // No se pudo actualizar el usuario
                                    return this.generateErrorApiResultBase({message: ''}, VerifyAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.userMessageCode, VerifyAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.message, VerifyAccountUseCase.ERROR_CAN_NOT_UPDATE_USER_STATUS.code);
                            }
                }
            } else {
                // El usuario no esta en modo verificacion y por lo tanto no se puede activar
                if ( userOrVerifyResult === VerifyTokenAndAccountResult.TokenOKAndAccountNotInActivationStatus) {
                    return this.generateErrorApiResultBase({message: ''}, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.userMessageCode, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.message, VerifyAccountUseCase.ERROR_USER_NOT_ON_VERIFICATION_STATUS.code);
                } else if (userOrVerifyResult === VerifyTokenAndAccountResult.TokenOKAndUndefinedUser) {
                    // Si se da este caso hay que tener cuidado ya que significa que no se encontro el usuario y puede ser
                    // que el token no se haya generado por el sistema
                } else {
                    // const sendEmailCommand: SendEmailCommand = { body : 'Warning, a token was received and not user was found', isBodyHtml: false, lang: Langs.es_MX, tos: [], subject: 'Warning' };
                    // this.sendEmail();
                    return this.generateErrorApiResultBase(exception, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.userMessageCode, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.message, VerifyAccountUseCase.ERROR_TOKENOK_USER_UNDEFINED.code);
                }
            }

        } catch (exception) {
            if (exception) {
                if (TypesConverter.hasProperty(exception, 'name')) {
                    switch (exception.name) {
                        case 'TokenExpiredError': return this.generateErrorApiResultBase(exception, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.userMessageCode, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.message, VerifyAccountUseCase.ERROR_EXPIRED_TOKEN.code);
                        default: return this.generateErrorApiResultBase(exception, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.userMessageCode, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.message, VerifyAccountUseCase.ERROR_UNKNOW_ERROR.code);
                    }
                }
            } else {
                return this.generateErrorApiResultBase({message: 'Error: no exception throwed'}, '', '', ApiResultBase.ERROR_CODE);
            }
        }
    }

    private async generateToken(payload: {id: string}, signOptions: SignOptions): Promise<string> {

        return await this.jwtService.signAsync(payload, signOptions);
    }

    /**
     * Este metodo construye un objeto ApiResultBase de exito para ser enviado al cliente en respuesta a una solicitud. El objeto
     * erro de ApiResultBase es nulo. El mensaje de la aplicacion (applicationMessage) solo sera asignara cuando el sistema se 
     * ejecute en un ambiente no productivo. El codigo del resultado (resultCode) siempre se enviara. La bandera success se establece
     * a verdadero 
     * @param data objeto dto que se devuelve al cliente
     * @param userMessageCode codigo del mensaje que se buscara en la base de datos para mostrarselo al usuario
     * @param applicationMessage mensaje de aplicacion (para uso interno)
     * @param resultCode codigo del resultado
     * @param lang lenguaje del mensaje al usuario
     */
    private async generateSuccessApiResultBase(data: any, userMessageCode: string = '', applicationMessage: string, resultCode: number, lang: Langs = this.appConfigService.getDefaultLanguage()) {
        const result = new ApiResultBase();
        result.data = data;
        result.isSuccess = true;
        result.applicationMessage = this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? applicationMessage : ApiResultBase.SUCCESS;
        result.resultCode = resultCode;
        const userMessage: Message = userMessageCode !== '' ? await this.messagesRepository.getMessageByLanguageAndCode(lang, userMessageCode) : null;
        result.userMessage = userMessage != null && userMessage != undefined ? userMessage.value : ApiResultBase.SUCCESS;
        return result;
    }

    /**
     * 
     * @param error 
     * @param userMessageCode 
     * @param applicationMessage 
     * @param resultCode 
     * @param lang 
     */
    private async generateErrorApiResultBase(error: any, userMessageCode: string, applicationMessage: string, resultCode: number, lang: Langs = this.appConfigService.getDefaultLanguage()): Promise<ApiResultBase> {
        const result = new ApiResultBase();
        result.error = this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? error : ApiResultBase.ERROR;
        result.isSuccess = false;
        result.applicationMessage = this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? applicationMessage : ApiResultBase.ERROR;
        result.resultCode = resultCode;
        const userMessage: Message = await this.messagesRepository.getMessageByLanguageAndCode(lang, userMessageCode);
        result.userMessage = userMessage != null && userMessage != undefined ? userMessage.value : ApiResultBase.ERROR;
        return result;

    }


    /**
     * 
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


    private log(logger: Logger, code: number, message: string, error?: any) {

        const msg = `code: ${code}, msg: ${message}, err: ${error}`;
        this.logger.error(msg);
    }
}


