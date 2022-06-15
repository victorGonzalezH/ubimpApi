import { UseCases } from "../use-cases.enum";

export class OnSiginUserUseCase {

    public static readonly ERROR_GET_USER = { userMessageCode: 'ERROR_GET_USER', message: 'Error getting user', code: UseCases.ON_SIGNIN_USER + 1 };
    public static readonly ERROR_SENDING_EMAIL = { userMessageCode: 'ERROR_SENDING_EMAIL', message: 'Error sending email', code: UseCases.ON_SIGNIN_USER + 2 };
    public static readonly ERROR_CREATE_USER = { userMessageCode: 'ERROR_CREATE_USER', message: 'Error creating user', code: UseCases.ON_SIGNIN_USER + 3 };
}
