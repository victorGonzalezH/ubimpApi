import { UseCases } from "../use-cases.enum";

export class OnGettingDevices {

    public static readonly SUCCESS_ON_GETTING_DEVICES = { userMessageCode: 'SUCCESS_ON_GETTING_DEVICES', message: 'The device was successfully activated', code: UseCases.ON_GETTING_DEVICES + 0};
    public static readonly ERROR_UNKNOW_ON_GETTING_DEVICES = { userMessageCode: 'ERROR_UNKNOW_ON_GETTING_DEVICES', message: 'User not found as the owner of this device', code: UseCases.ON_GETTING_DEVICES + 1};
    public static readonly ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES = { userMessageCode: 'ERROR_USER_NOT_FOUND_ON_GETTING_DEVICES', message: 'User not found as the owner of this device', code: UseCases.ON_GETTING_DEVICES + 1};
    public static readonly ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES = { userMessageCode: 'ERROR_USER_NOT_ACTIVE_ON_GETTING_DEVICES', message: 'User owner has no active status', code: UseCases.ON_GETTING_DEVICES + 2 };

}
