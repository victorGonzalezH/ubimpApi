import * as mongoose from 'mongoose';

// id. Mongo se encarga de agregar la propiedad _id
export const VehicleGroupSchema = new mongoose.Schema({
    
    /**
     * Nombre del grupo de vehiculos
     */
    name: { type: String, required: true },

    /**
     * 
     */
    order: { type: Number, required: true },


    /**
     * Identificadores de los vehiculos que pertenecen al grupo
     */
    vehiclesIds: { type: [String], required: true },

});
