export class OnActivateDevice {

    public static readonly SUCCESS_ON_ACTIVATE_DEVICE = { userMessageCode: 'SUCCESS_ON_ACTIVATE_DEVICE', message: 'The device was successfully activated', code: 30 };
    public static readonly ERROR_ON_USER_SERVICE = { userMessageCode: 'ERROR_USER_SERVICE_NOT_WORKING', message: 'User service not running', code: 31 };
    public static readonly ERROR_INCORRECT_EMAIL_PASSWORD = { userMessageCode: 'ERROR_BLACK_LISTED_USER', message: 'Incorrect email or password', code: 32 };
    public static readonly ERROR_ON_GETTING_COUNTRY = { userMessageCode: 'ERROR_ON_GETTING_COUNTRY', message: 'Error getting country by id in activate device', code: 33 };
    public static readonly ERROR_ON_SENDING_SMS_MESSAGE = { userMessageCode: 'ERROR_ON_SENDING_SMS_MESSAGE', message: 'Error on sending sms message', code: 34 };
    public static readonly ERROR_ON_ACTIVATE_DEVICE_ERROR_ON_SMS_SERVICE = { userMessageCode: 'ERROR_ON_ACTIVATE_DEVICE_ERROR_ON_SMS_SERVICE', message: 'On activate devices, there is an error on the SMS service, could not be running', code: 35 };

}
