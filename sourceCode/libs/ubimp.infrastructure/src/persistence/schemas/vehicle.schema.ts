import * as mongoose from 'mongoose';


export const VehicleSchema = new mongoose.Schema({

    // id. Mongo se encarga de agregar la propiedad _id
    
    /**
     * Nombre del vehiculo u objeto
     */
    name: { type: String, required: true },

    /**
     * Identificador del usuario dueno del vehiculo
     */
     ownerId: { type: String, required: true },

    /**
     * Device id
     */
     deviceId : { type: String, required: true },

     /**
      * Object type Id
      */
    objectTypeId: { type: String, required: true },

    /**
     * Brand Id
     */
    brandId: {type: String, required: false },
    
    /**
     * Identificador del modelo
     */
    modelId: {type: String, required: false },

    /**
     * Placa
     */
    licensePlate : { type: String, required: false },


    /**
     * Year, in case it is a vehicle
     */
    year: { type: String, required: false },

   /**
   * Description optional
   */
    description: { type: String, required: true },
});
