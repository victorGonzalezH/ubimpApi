import * as mongoose from 'mongoose';

// id. Mongo se encarga de agregar la propiedad _id
export const VehicleSchema = new mongoose.Schema({
    
    /**
     * Nombre del vehiculo u objeto
     */
    name: { type: String, required: true },

    /**
     * Identificador del usuario dueno del vehiculo
     */
    userId: { type: String, required: true },
    
    /**
     * Grupo al que pertenece el vehiculo
     */
    groupId: { type: String, required: true },

    /**
     * Icono del vehiculo
     */
    icon: { type: String, required: true },
    
    /**
     * Identificador de la marca
     */
    brandId: { type: String, required: false },

    /**
     * Identificador del modelo
     */
    modelId: {type: String, required: false },

    /**
     * Placa
     */
    licensePlate : { type: String, required: false },


});
