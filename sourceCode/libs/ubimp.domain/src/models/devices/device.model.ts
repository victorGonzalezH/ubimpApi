
/**
 * Clase dominio de dispositivo
 */
export class Device {

    public _id: string;

    /**
     * IMEI
     */
    public imei: string;

    /**
     * Numeros telefonicos que ha tenido este dispositivo, el ultimo numero es el actual
     */
    private phoneNumbers: string[];

    
    /**
     * Indica el numero de telefono actual que usa el dispositivo
     */
    public currentPhoneNumber: string;

    /**
     * Listado de usuarios que han sido dueños del dispositivo, incluyendo el actual
     */
    private users: string[];
    
    /**
     * Indica el id del acutal dueno del dispositivo
     */
     public currentOwnerId: string;

    
    /**
     * Establish if the device if assigned to a vehicle or not
     */
    isAssigned: boolean;
    

    constructor() {
          this.phoneNumbers = [];
          this.users = [];
          this.currentOwnerId = '';
          this.currentPhoneNumber = '';
          this.isAssigned = false;
          this.imei = '';
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
     * @returns Obtiene el identificador del ultimo usuario propietario
     */
    public getLastOwnerId(): string {
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
            this.currentPhoneNumber = phoneNumber;
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
            this.currentOwnerId = userId;
        }
    }


}