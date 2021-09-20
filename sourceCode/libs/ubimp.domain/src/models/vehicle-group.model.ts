export class VehicleGroup  {

    public name: string;

    public order: number;

    private vehiclesIds: string[];

    constructor() {
        this.vehiclesIds = [];
    }

    public addVehicleId(vehicleId: string) {
        this.vehiclesIds.push(vehicleId);
    }

    
}