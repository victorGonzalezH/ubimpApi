import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginCommand {

    constructor(username: string, password: string, systemId: string) {
        this.username = username;
        this.password = password;
        this.systemId = systemId;
    }

    @IsEmail()
    username: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    systemId: string;

}
