import { UserPrefObjectsGroup } from "./user-pref-objects-group.model";

export class UserPreferences {

    /** User Id */
    userId: string;

    /** object/vehicles groups */
    objectsGroups: UserPrefObjectsGroup[];

    /**
     * Language
     */
    language: string;

    /** autozoom */
    autozoom: boolean;
    
    /** Show vehicles on map */
    showVehiclesOnMap: boolean;

    /**
     * Enable real time
     */
    enableRealTime: boolean;

}