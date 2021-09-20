import * as mongoose from 'mongoose';

// id. Mongo se encarga de agregar la propiedad _id
export const DeviceSchema = new mongoose.Schema({
    
    /**
     * Imei del dispositivo
     */
    imei: { type: String, required: true },
    
    /**
     * Numero de telefonos que ha tenido el dispositivo incluyendo el actual
     */
     phoneNumbers: { type: [String], required: false },

       /**
     * Indica si el ultimo numero en el listado de nuemeros telefonicos es el actual que usa
     * el dispositivo
     */
     lastPhoneNumberIsTheCurrentOne: {type: Boolean,required: true },

     /**
      * Usuarios que ha tenido el dispositivo incluyendo el actual
      */
     users: { type: [String], required: false },

     
     /**
     * Indica si el ultimo usuario en el listado de usuarios es el actual usuario "dueño" del
     * dispositivo
     */
     lastUserIsTheCurrentOne : { type: Boolean, required: true },


});
