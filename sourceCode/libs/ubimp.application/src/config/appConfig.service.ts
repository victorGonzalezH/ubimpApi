import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices/enums/transport.enum';
import { Langs } from 'utils/dist/application/Enums/langs.enum';
import { SignOptions } from 'jsonwebtoken';
import { EnvironmentTypes } from 'utils/dist/application/Enums/environmentTypes.enum';

@Injectable()
export class AppConfigService {

    private systemId: string;

    private environmentDescription: string;
    private environment: EnvironmentTypes;
    private envTag: string;

    // ms significa microservice
    private msProtocol: Transport;
    private msPort: number;
    private msHost: string;

    private webPort: number;
    private webHost: string;
    private webProtocol: string;

    // Propiedades del servicio de usuario
    private usersServicePort: number;
    private usersServiceProtocol: number;
    private usersServiceHost: string;

    private infrastructureServicePort: number;
    private infrastructureServiceProtocol: number;
    private infrastructureServiceHost: string;

    private disableErrorMessages: boolean;

    private defaultLanguage: Langs;

    private templatesPath: string;
    private passwordSaltRoundsLocal: number;
    private activationTokenLocal: SignOptions;
    private accessTokenLocal: SignOptions;

    private smsVerificationCodeLengthLocal: number;

    constructor(private configService: ConfigService) {
        this.environmentDescription = process.env.NODE_ENV === 'production' ? 'production' : 'development' ;
        if (this.environmentDescription === 'production') { this.environment = EnvironmentTypes.prod; } else if (this.environmentDescription === 'quality') { this.environment = EnvironmentTypes.qa; } else { this.environment = EnvironmentTypes.dev;}
        this.envTag = process.env.NODE_ENV === 'production' ? 'prod' : 'dev' ;
        this.defaultLanguage =  Langs[this.configService.get<string>('defaultLanguage')];
        this.disableErrorMessages = this.envTag === 'prod' ? true : false;
        this.webPort = this.configService.get<number>(this.envTag + '.web.port');
        this.webHost = this.configService.get<string>(this.envTag + '.web.host');
        this.webProtocol = this.configService.get<string>(this.envTag + '.web.protocol');
        this.msProtocol = this.converStringProtocol(configService.get<number>(this.envTag + '.microservice.protocol'));
        this.msPort = this.configService.get<number>(this.envTag + '.microservice.port');
        this.msHost = this.configService.get<string>(this.envTag + '.microservice.host');
        this.usersServicePort       = this.configService.get<number>(this.envTag + '.service.users.port');
        this.usersServiceProtocol   = this.configService.get<number>(this.envTag + '.service.users.protocol');
        this.usersServiceHost       = this.configService.get<string>(this.envTag + '.service.users.host');

        this.infrastructureServicePort       = this.configService.get<number>(this.envTag + '.service.infrastructure.port');
        this.infrastructureServiceProtocol   = this.configService.get<number>(this.envTag + '.service.infrastructure.protocol');
        this.infrastructureServiceHost       = this.configService.get<string>(this.envTag + '.service.infrastructure.host');

        this.systemId = this.configService.get<string>('SYSTEM_ID');

        this.templatesPath = this.configService.get<string>(this.envTag + '.templates.path');
        // this.passwordSaltRoundsLocal   = this.configService.get<number>(this.envTag + '.passwordSaltRounds');
        this.passwordSaltRoundsLocal = 15; // <-- NO ES POSIBLE USAR UNA VARIABLE AQUI POR QUE LA FUNCION genSalt NO LO ACEPTA

        this.activationTokenLocal = this.configService.get<SignOptions>(this.envTag + '.tokens.activation');
        this.accessTokenLocal = this.configService.get<SignOptions>(this.envTag + '.tokens.access');
        this.smsVerificationCodeLengthLocal = this.configService.get<number>('sms_verification_code_length');
    }

    /**
     * Obtiene el ambiente de ejecucion
     */
    public getEnvironment(): EnvironmentTypes {
        return this.environment;
    }

    /**
     * Devuelve el protocolo a usar para el microservicio
     */
    public getMicroserviceProtocol(): number {
        return this.msProtocol;
    }

    /**
     * Devuelve el nombre del host
     */
    public getMicroserviceHost(): string {
        return this.msHost;
    }

    /**
     * Devuelve el puerto del microservicio
     */
    public getMicroservicePort(): number {
        return this.msPort;
    }

    /**
     * Obtiene el puerto web
     */
    public getWebPort(): number {
        return this.webPort;
    }

    /**
     *   TCP = 0,
     * REDIS = 1,
     * NATS = 2,
     * MQTT = 3,
     * GRPC = 4,
     * RMQ = 5,
     * KAFKA = 6
     */
    private converStringProtocol(protocolNumber: number): Transport {
        return protocolNumber;
    }

    /**
     * 
     */
    public getUsersServiceConfig() {

        return {  transport: this.usersServiceProtocol, options: { host: this.usersServiceHost, port: this.usersServicePort  } };
    }


    public getInfrastructureServiceConfig() {

        // tslint:disable-next-line: max-line-length
        return {  transport: this.infrastructureServiceProtocol, options: { host: this.infrastructureServiceHost, port: this.infrastructureServicePort  } };
    }

    /**
     * Obtiene el identificador del sistema
     */
    public getSystemId(): string {
        return this.systemId;
    }

    /**
     * Indica si se habilitan o deshabilitan los mensajes de errores que se envian a los clientes
     */
    public getDisableErrorMessages(): boolean {
        return this.disableErrorMessages;
    }


    public getDefaultLanguage(): Langs {
        return this.defaultLanguage;
    }

    public getTemplatesPath(): string {
        return this.templatesPath;
    }

    get passwordSaltRounds(): number {
        return this.passwordSaltRoundsLocal;
    }

    get activationTokenOptions(): SignOptions {
        return this.activationTokenLocal;
    }

    /**
     * Obtiene el host actual web / get de actual web host
     */
    get currentHost() {

        return  `${this.webProtocol}://${this.webHost}:${this.webPort}`;
    }

    /**
     * Longitud del codigo de verificacion del sms
     */
    get smsVerificationCodeLength() {
        return this.smsVerificationCodeLengthLocal;
    }

}
