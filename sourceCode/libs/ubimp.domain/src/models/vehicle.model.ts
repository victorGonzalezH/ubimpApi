import { UbimpBase } from "./ubimp-base.model";

/**
 * Clase dominio de un vehiculo
 */
 export class Vehicle extends UbimpBase {
    
    constructor(
    public name: string,
    public ownerId: string,
    public deviceId: string,
    public objectTypeId: string,
    public description: string,
    public brandId?: string,
    public modelId?: string,
    public licensePlate?: string,
    public year?: string) {
        super();
    }


   static createMockObject(): UbimpBase {

        return new Vehicle('','','','','','','','','');
    }
}