export class VerifyAccountUseCase {

    public static readonly ERROR_EXPIRED_TOKEN = { userMessageCode: 'ERROR_EXPIRED_TOKEN', message: 'Verification token is expired', code: 31 };
    public static readonly ERROR_UNKNOW_ERROR = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'Unknow error in verification token', code: 32 };
    public static readonly ERROR_CAN_NOT_UPDATE_USER_STATUS = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'Can not update user status to activated', code: 33 };
    public static readonly ERROR_USER_NOT_ON_VERIFICATION_STATUS = { userMessageCode: 'ERROR_USER_NOT_ON_VERIFICATION_STATUS', message: 'User not in on verification phase', code: 34 };
    public static readonly ERROR_TOKENOK_USER_UNDEFINED = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'The token is valid but the user was not found', code: 35 };
    public static readonly SUCCESS_USER_IS_READY_TO_ACTIVATE = { userMessageCode: '', message: 'User is ready to be activated', code: 36 };

    public static readonly ERROR = { userMessageCode: '', message: 'User is ready to be activated', code: 37 };
}
