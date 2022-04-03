import { IsNotEmpty } from "class-validator";
import { BaseCommand } from "utils";

/**
 * Command for save a vehicle. In this command we try to no expose the criticals database ids, so we
 * use the names of the entities instead of their ids. You have to ensure that the names corresponds to
 * the correct entities
 */
export class UpdateVehicleCommand extends BaseCommand {
    
     /**
     * username of the user
     */
   @IsNotEmpty()
   username: string;


    // name of the object or vehicle
    name?: string;

   
    imei?: string;


    objectTypeId?: string;


    vehicleGroupName?: string;

     /**
      * 
      */
     brand?: string;
    
    /**
     * 
     * */ 
    model?: string;
    

    /**
     * License plate in case the object is a vehicle
     */
    licensePlate?: string;

    /**
     * Year, in case the object is a vehicle
     */
    year?: string;

    /**
     * Description
     */
    description?: string;
}