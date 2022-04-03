import { UbimpBase } from "./ubimp-base.model";

/**
 * Clase dominio de un vehiculo
 */
 export class User extends UbimpBase {
    

    public username: string;
    
    public userStatus: number;

    // public _id: string;

    public ownerId: string;

    public roles: string[];
    
    constructor() {
        super();
    }


    createMockObject(): UbimpBase {
        throw new Error("Method not implemented.");
    }
}