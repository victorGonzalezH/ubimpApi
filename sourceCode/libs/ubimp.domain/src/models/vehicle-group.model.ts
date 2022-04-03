import { UbimpBase } from "./ubimp-base.model";

export class VehicleGroup extends UbimpBase {
    
    
    public vehiclesIds: string[];

    
    constructor(public name: string,  public userId: string, public order?: number) {
        super();
        this.vehiclesIds = [];
    }

    public addVehicleId(vehicleId: string) {
        this.vehiclesIds.push(vehicleId);
    }

    createMockObject(): UbimpBase {
        throw new Error("Method not implemented.");
    }
}