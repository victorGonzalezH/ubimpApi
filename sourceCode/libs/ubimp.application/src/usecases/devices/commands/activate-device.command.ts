import { IsEmail, IsNotEmpty } from 'class-validator';

export class ActivateDeviceCommand {


    /**
     * 
     * @param email Correo del usuario a quien se le agregara el dispositivo en caso de que se registre on exito
     * @param password Contrasena del usuario quien se le agregara el dispositivo en caso de que se registre on exito
     * @param imei IMEI del dispositivo
     * @param phoneNumber Numero de telefono
     * @param countryId Codigo del pais
     * @param timeStamp marca de tiempo que envia el dispositivo
     */
    constructor(email: string, password: string, imei: string, phoneNumber: string, countryId: string, timeStamp: string) {
        this.Email = email;
        this.Password = password;
        this.Imei = imei;
        this.PhoneNumber = phoneNumber;
        this.CountryId = countryId;
        this.TimeStamp = timeStamp;
    }

    @IsNotEmpty()
    Imei: string;

    @IsEmail()
    Email: string;

    @IsNotEmpty()
    Password: string;

    @IsNotEmpty()
    PhoneNumber: string;

    @IsNotEmpty()
    CountryId: string;

    @IsNotEmpty()
    TimeStamp: string;

    @IsNotEmpty()
    Lang: string;
}
