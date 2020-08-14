import { UserStatus } from './userStatus.enum';
import { UserTypes } from './userTypes.enum';

export class CreateOnVerificationUserCommand {

    public othersProperties: any;

    constructor(public username: string, public password: string, public name: string, public lastName: string,
                public systemId: string, userType: UserTypes, public callSource: number, public activationId: number, secondLastName?: string) {

                this.othersProperties = { userStatus: UserStatus.OnVerification, activationAttempts: 1, isEnabled: false,
                secondLastName, activatedDate: null, userType, activationId };

    }

    public static createCommand(username: string, password: string, name: string, lastName: string,
                                secondLastName: string, systemId: string, userType: UserTypes, activationId: number, callSource: number = 1) {

                                // tslint:disable-next-line: max-line-length
                                return new CreateOnVerificationUserCommand (username, password, name, lastName, systemId, userType, callSource, activationId, secondLastName);
    }
}
