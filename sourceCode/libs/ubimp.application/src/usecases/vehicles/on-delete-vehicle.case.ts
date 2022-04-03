import { UseCases } from "../use-cases.enum";

export class OnDeleteVehicleCase {

    public static readonly ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE = { userMessageCode: 'ERROR_NO_DOCUMENT_DELETED_ON_DELETING_VEHICLE', message: 'No document was deleted', code: UseCases.ON_DELETE_VEHICLE + 1};
    
}