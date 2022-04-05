import { Min, Max, IsNotEmpty, IsEmail, Matches } from 'class-validator';
import { BaseCommand } from 'utils/dist/application/Commands/BaseCommand.model';

export class SignInCommand extends BaseCommand {

    @IsNotEmpty() @IsEmail()
    username: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    lastName: string;

    secondLastName: string;

    countryId: string;

    stateId: string;

    street: string;

    number: string;

    postalCode: string;

    /**
     * If the user has an owner, this could happen when a owner user adds a user from his
     * session
     */
    ownerId: string;

    /** This property is not sent by the client.
     * The backend is in charge to set the systemId
    */
     systemId: string;

    constructor() {
        super();
    }
}
