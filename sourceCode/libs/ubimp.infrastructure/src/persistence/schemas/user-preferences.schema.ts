import { UserPrefObjectsGroup } from '@ubd/ubimp.domain/models/user-pref-objects-group.model';
import * as mongoose from 'mongoose';

// id. Mongo se encarga de agregar la propiedad _id
export const UserPreferencesSchema = new mongoose.Schema({
    
    /**
     * Identificador del usuario
     */
    userId: { type: String, required: true },
    
    /**
     * groups of object/vehicles to visualize in the ui
     */
    objectsGroups: {type: [UserPrefObjectsGroup], required: true },


    language: { type: String, required: true },

     /** autozoom */
     autozoom: { type: Boolean, required: true },
    

     /** Show vehicles on map */
     showVehiclesOnMap: { type: Boolean, required: true },

    /**
     * Enable real time on the map
     */
     enableRealTime: { type: Boolean, required: true }

});
