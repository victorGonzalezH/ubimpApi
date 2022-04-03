import { UseCases } from "../use-cases.enum";

export class OnDeleteGroupCase {
 
    public static readonly ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP = { userMessageCode: 'ERROR_NO_DOCUMENT_DELETED_ON_DELETING_GROUP', message: 'No document was deleted', code: UseCases.ON_DELETE_GROUP + 1};
    public static readonly ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP = { userMessageCode: 'ERROR_CAN_NOT_DELETE_DEFAULT_ON_DELETING_GROUP', message: 'Can not delete default group', code: UseCases.ON_DELETE_GROUP + 2};
}