import { UseCases } from "../use-cases.enum";

export class ActivateAccountUseCase {

    public static readonly SUCCESS_USER_ACTIVATED = { userMessageCode: 'SUCCESS_USER_ACTIVATED', message: 'User was successfully activated', code: UseCases.ON_ACTIVATE_ACCOUNT };
    public static readonly ERROR_EXPIRED_TOKEN = { userMessageCode: 'ERROR_EXPIRED_TOKEN', message: 'Verification token is expired', code: UseCases.ON_ACTIVATE_ACCOUNT + 1 };
    public static readonly ERROR_UNKNOW_ERROR = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'Unknow error in verification token', code: UseCases.ON_ACTIVATE_ACCOUNT + 2 };
    public static readonly ERROR_CAN_NOT_UPDATE_USER_STATUS = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'Can not update user status to activated', code: UseCases.ON_ACTIVATE_ACCOUNT + 3 };
    public static readonly ERROR_USER_NOT_ON_VERIFICATION_STATUS = { userMessageCode: 'ERROR_USER_NOT_ON_VERIFICATION_STATUS', message: 'User not in on verification phase', code: UseCases.ON_ACTIVATE_ACCOUNT + 4 };
    public static readonly ERROR_TOKENOK_USER_UNDEFINED = { userMessageCode: 'ERROR_ON_VERIFY_ACCOUNT', message: 'The token is valid but the user was not found', code: UseCases.ON_ACTIVATE_ACCOUNT + 5 };
    public static readonly SUCCESS_USER_IS_READY_TO_ACTIVATE = { userMessageCode: '', message: 'User is ready to be activated', code: UseCases.ON_ACTIVATE_ACCOUNT + 6 };
    public static readonly ERROR = { userMessageCode: '', message: 'User is ready to be activated', code: UseCases.ON_ACTIVATE_ACCOUNT + 7 };
}
