import { UserStatus } from './userStatus.enum';
import { UserTypes } from './userTypes.enum';

/**
 * Command for creating a new user on verification phase
 */
export class CreateOnVerificationUserCommand {

    /**
     * We use the other properties object to pass (to the users microservice ) those properties who are not
     * common in the users microservice. For example the properties username, password, name and lastname are required
     * to create a user in the users microservice, (they are common properties in a user creation process), however,
     * the countryId, stateId and postal they can be optional, so we adde  them in the other properties object, the 
     * users microservice will process and save them as properties in the users database
     */
    public othersProperties: any;

    constructor(public username: string, public password: string, public name: string, public lastName: string,
                public countryId: string, public stateId: string, public number: string, public postalCode: string, public ownerId, public systemId: string, public roleId: number, userType: UserTypes, public callSource: number, public activationId: number, secondLastName?: string) {

                this.othersProperties = 
                {   userStatus: UserStatus.OnVerification, 
                    activationAttempts: 1, 
                    isEnabled: false,
                    secondLastName, 
                    activatedDate: null,
                    userType, 
                    activationId, 
                    countryId: this.countryId, 
                    stateId: this.stateId, 
                    number: this.number,
                    postalCode: this.postalCode,
                    ownerId: this.ownerId
                };

    }

    /**
     * Static method for creating a create user on verification command. This command is used to crea 
     * a new user
     * @param username user name of the user
     * @param password password
     * @param name  name
     * @param lastName lastname
     * @param secondLastName second last name
     * @param countryId country Id
     * @param stateId state id
     * @param number number
     * @param postalCode postal code
     * @param ownerId ownerId. This is the Id of a user who has requested to create a user on his acccount (and extended user)
     * @param systemId system id
     * @param userType The type of the user, can be owner, or extended
     * @param activationId Id of the activation phase
     * @param callSource if this command was used by an microservice call or a web app client
     * @returns A new command for create a new user in the verification phase
     */
    public static createCommand(username: string, password: string, name: string, lastName: string,
                                secondLastName: string, countryId: string, stateId: string, number: string, postalCode:string, ownerId: string, systemId: string, roleId:number, userType: UserTypes, activationId: number, callSource: number = 1) {

                                // tslint:disable-next-line: max-line-length
                                return new CreateOnVerificationUserCommand (username, password, name, lastName, countryId, stateId, number, postalCode, ownerId, systemId, roleId, userType, callSource, activationId, secondLastName);
    }
}
