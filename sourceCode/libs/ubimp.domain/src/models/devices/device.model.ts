
/**
 * Clase dominio de dispositivo
 */
export class Device {

    /**
     * IMEI
     */
    public imei: string;

    /**
     * Numeros telefonicos que ha tenido este dispositivo, el ultimo numero es el actual
     */
    private phoneNumbers: string[];

    /**
     * Indica si el ultimo numero en el listado de nuemeros telefonicos es el actual que usa
     * el dispositivo
     */
    public lastPhoneNumberIsTheCurrentOne: boolean;


    /**
     * Listado de usuarios que han usado el dispositivo, incluyendo el actual
     */
    private users: string[];

    /**
     * Indica si el ultimo usuario en el listado de usuarios es el actual usuario "dueño" del
     * dispositivo
     */
    public lastUserIsTheCurrentOne: boolean;


    constructor() {

          this.phoneNumbers = [];
          this.users = [];
          this.lastUserIsTheCurrentOne = false;
          this.lastPhoneNumberIsTheCurrentOne = false;
    }


    /**
     * Obtiene el ultimo numero telefonico asignado a el dispositivo
     */
    getLastPhoneNumber(): string {
        if(this.phoneNumbers != null && this.phoneNumbers != undefined && this.phoneNumbers.length > 0)
         return this.phoneNumbers[this.phoneNumbers.length - 1];
         return null;
    }

    /**
     * 
     * @returns Obtiene el identificador del ultimo usuario
     */
    getLastUserId(): string {
        if(this.users != null && this.users != undefined && this.users.length > 0)
        {
            return this.users[this.users.length - 1];
        }

        return null;
    }


    /**
     * Agrega un numero
     * @param phoneNumber 
     */
    addPhoneNumber(phoneNumber: string) {
        if(this.phoneNumbers != null && this.phoneNumbers != undefined)
        {
            this.phoneNumbers.push(phoneNumber);
            this.lastPhoneNumberIsTheCurrentOne = true;
        }
    }

    /**
     * Agrega un usuario a el dispositivo. Este ultimo usuario agregado se toma como el usuario
     * "dueño" actual del dispositivo
     * @param userId Identificador del usuario
     */
    addUser(userId: string) {
        if(this.users != null && this.users != undefined)
        {
            this.users.push(userId);
            this.lastUserIsTheCurrentOne = true;
        }
    }


}