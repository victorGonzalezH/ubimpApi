export interface SendSMSCommand {

    /**
     * Numero de telefono
     */
    phoneNumber: string;
    
    /**
     * Mensaje
     */
    message: string;

    /**
     * Id del enviador
     */
    senderId: string;

    /**
     * Tipo de mensaje sms
     */
    smsType: number;
}
