import { UseCases } from "../use-cases.enum";

export class OnSaveVehicleUseCase {
    
    public static readonly ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_USER_NOT_FOUND_ON_SAVING_VEHICLE', message: 'User not found', code: UseCases.ON_SAVE_VEHICLE + 1};
    public static readonly ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_BRAND_NOT_FOUND_ON_SAVING_VEHICLE', message: 'Brand not found', code: UseCases.ON_SAVE_VEHICLE + 2};
    public static readonly ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_MODEL_NOT_FOUND_ON_SAVING_VEHICLE', message: 'Model not found', code: UseCases.ON_SAVE_VEHICLE + 3};
    public static readonly ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_DEVICE_NOT_FOUND_ON_SAVING_VEHICLE', message: 'Device not found', code: UseCases.ON_SAVE_VEHICLE + 4};
    public static readonly ERROR_VEHICLE_GROUP_NOT_FOUND_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_VEHICLE_GROUP_NOT_FOUND_ON_SAVING_VEHICLE', message: 'Vehicle group not found', code: UseCases.ON_SAVE_VEHICLE + 5};
    public static readonly ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE = { userMessageCode: 'ERROR_SAVING_VEHICLE_ON_SAVING_VEHICLE', message: 'Error saving vehicle', code: UseCases.ON_SAVE_VEHICLE + 6};
    
    // public static readonly ERROR_SENDING_EMAIL = { userMessageCode: 'ERROR_SENDING_EMAIL', message: 'Error sending email', code: UseCases.ON_SIGNIN_USER + 2 };
    // public static readonly ERROR_CREATE_USER = { userMessageCode: 'ERROR_CREATE_USER', message: 'Error creating user', code: UseCases.ON_SIGNIN_USER + 3 };
}
