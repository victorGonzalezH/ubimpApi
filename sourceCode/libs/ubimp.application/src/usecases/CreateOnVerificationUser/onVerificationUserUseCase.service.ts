import { Template } from 'uba/ubimp.application/services/templates/template.model';
import { TemplatesTypes } from 'uba/ubimp.application/services/templates/templatesTypes.enum';

export class OnVerificationUserUseCase {

    public static readonly ERROR_BLACK_LISTED_USER = { userMessageCode: 'ERROR_BLACK_LISTED_USER', message: 'User is blacklisted', code: 21 };
    public static readonly SUCCESS_ON_VERIFICATION_USER = { message: 'User is on verification', code: 22 };
    public static readonly WARNING_ON_VERIFICATION_USER_ATEMPT = { userMessageCode: 'ON_VERIFICATION_USER_ATEMPT', message: 'User is triying on verification again', code: 23 };
    public static verificationUserTemplate: Template = new Template('activateAccount', '', TemplatesTypes.HTML);
    public static readonly VERIFY_URL_PATH = '/verify';

}
