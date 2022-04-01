import { Message } from "@ubd/ubimp.domain";
import { MessagesRepository } from "@ubi/ubimp.infrastructure/persistence/repositories/messages.repository.service";
import { ApiResultBase, ApiResultBaseDto, ApplicationBase } from "utils";
import { AppConfigService } from "./config/appConfig.service";
import { EnvironmentTypes, Langs } from 'utils';
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CallSources } from "./enums/callSources.enum";

export class ApplicationBaseService extends ApplicationBase
{

    constructor(public appConfigService: AppConfigService,
        public messagesRepository: MessagesRepository,
        @Inject('USERS_SERVICE') public usersClient: ClientProxy)
    {
        super();
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
     public async generateCustomSuccessApiResultBase(data: any, userMessageCode: string = '', applicationMessage: string, resultCode: number, lang: Langs = this.appConfigService.getDefaultLanguage(), token: string = null): Promise<ApiResultBaseDto> {
        const userMessage: Message = userMessageCode !== '' ? await this.messagesRepository.getMessageByLanguageAndCode(lang, userMessageCode) : null;
        const result: ApiResultBaseDto = {

            data,
            isSuccess: true,
            applicationMessage: this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? applicationMessage : ApiResultBase.SUCCESS,
            resultCode,
            userMessage: userMessage != null && userMessage != undefined ? userMessage.value : ApiResultBase.SUCCESS,
            error: null,
            token,
        };

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
    public async generateCustomErrorApiResultBase(error: any, userMessageCode: string, applicationMessage: string, resultCode: number, lang: Langs = this.appConfigService.getDefaultLanguage(), token: string = null): Promise<ApiResultBaseDto> {
        const userMessage: Message = await this.messagesRepository.getMessageByLanguageAndCode(lang, userMessageCode);
        const result: ApiResultBaseDto = {
            error: this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? error : ApiResultBase.ERROR,
            applicationMessage: this.appConfigService.getEnvironment() !== EnvironmentTypes.prod ? applicationMessage : ApiResultBase.ERROR,
            data: null,
            isSuccess: false,
            resultCode,
            userMessage: userMessage != null && userMessage != undefined ? userMessage.value : ApiResultBase.ERROR,
            token,
        };

        return result;
    }


    /**
     * Obtiene un usuario desde el microserservicio de usuarios.
     * Devuelve el objeto usuario tal cual
     */
     public async getUser(username: string): Promise<any> {
        const pattern = { command: 'getByUsername' };
        const getUserByNamePayLoad = { username, systemId: this.appConfigService.getSystemId(), callSource: CallSources.Microservice };

        try {
            // Se hace la llamada al servicio de usuarios para obtener el usuario
            const result = await this.usersClient.send(pattern, getUserByNamePayLoad).toPromise();
            return result;
        } catch (exception)  {
            throw exception;
            // return new AppInternalServerError();
        }
    }
}