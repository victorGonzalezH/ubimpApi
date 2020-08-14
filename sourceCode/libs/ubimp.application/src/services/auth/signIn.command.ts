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

    // @IsNotEmpty()
    // @Matches(/[0-9A-Fa-f]{24}/)
    systemId: string;


    constructor() {
        super();
    }
}
