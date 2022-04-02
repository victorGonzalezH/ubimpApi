import * as mongoose from 'mongoose';

// id. Mongo se encarga de agregar la propiedad _id
const DeviceSchema = new mongoose.Schema({
    
    /**
     * Imei del dispositivo
     */
    imei: { type: String, required: true },
    
    /**
     * Numero de telefonos que ha tenido el dispositivo incluyendo el actual
     */
     phoneNumbers: { type: [String], required: false },


    /**
     * 
     */
     currentPhoneNumber: {type: String, required: true },

     /**
      * Usuarios que ha tenido el dispositivo incluyendo el actual
      */
     users: { type: [String], required: false },

     
     /**
      * 
      */
     currentOwnerId : { type: String, required: true },


     /**
      * Indicates if the device is assigned 
      */
     isAssigned: { type: Boolean, required: true },

});


DeviceSchema.methods.getLastOwnerId = async function() {

  if(this.users != null && this.users != undefined && this.users.length > 0)
  {
      return this.users[this.users.length - 1];
  }
    return null;
  };

export { DeviceSchema };