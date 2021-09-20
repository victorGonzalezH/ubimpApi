import { IsEmail, IsNotEmpty } from 'class-validator';

export class ConfirmSmsArrivedCommand {

    @IsNotEmpty()
    Imei: string;

    @IsEmail()
    Email: string;

    @IsNotEmpty()
    PhoneNumber: string;

    @IsNotEmpty()
    Lang: string;

    constructor(imei: string, phoneNumber: string, email: string) {
        
        this.Email = email;
        this.Imei = imei;
        this.PhoneNumber = phoneNumber;

    }


}