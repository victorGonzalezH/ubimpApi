import { Template } from 'uba/ubimp.application/services/templates/template.model';
import { TemplatesTypes } from 'uba/ubimp.application/services/templates/templatesTypes.enum';
import { UseCases } from '../use-cases.enum';

export class OnVerificationUserUseCase {

    public static readonly SUCCESS_ON_USER_VERIFICATION = { userMessageCode: 'SUCCESS_ON_USER_VERIFICATION', message: 'User is on verification phase', code: UseCases.ON_VERIFICATION_USER };
    public static readonly ERROR_BLACK_LISTED_USER = { userMessageCode: 'ERROR_BLACK_LISTED_USER', message: 'User is blacklisted', code: UseCases.ON_VERIFICATION_USER + 1 };
    public static readonly ERROR_USER_CAN_NOT_BE_UPDATED = { userMessageCode: 'ERROR_USER_CAN_NOT_BE_UPDATED', message: 'User can not be updated, error from users microservice', code: UseCases.ON_VERIFICATION_USER + 2 };
    public static readonly WARNING_ON_VERIFICATION_USER_ATEMPT = { userMessageCode: 'WARNING_ON_VERIFICATION_USER_ATEMPT', message: 'User is triying on verification again', code: UseCases.ON_VERIFICATION_USER + 3 };
    public static readonly ERROR_NO_TEMPLATE_FOUND = { userMessageCode: 'ERROR_NO_TEMPLATE_FOUND', message: 'No template found for the language used', code: UseCases.ON_VERIFICATION_USER + 4 };
    public static readonly ERROR_USER_ALREADY_EXIST = { userMessageCode: 'ERROR_USER_ALREADY_EXIST', message: 'User already exist', code: UseCases.ON_VERIFICATION_USER + 5 };
    public static verificationUserTemplate: Template = new Template('activateAccount', '', TemplatesTypes.HTML);
    public static readonly ACTIVATE_URL_PATH = 'login/activate';

}
