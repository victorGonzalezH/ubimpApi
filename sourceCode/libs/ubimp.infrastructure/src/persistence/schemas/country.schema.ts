import * as mongoose from 'mongoose';

export const CountrySchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    
    /**
     * Nombre del pais en su idioma
     */
    name: { type: String, required: true },
    
    /**
     * Codigo telefonico del pais
     */
    phoneCode: { type: String, required: true },

    /**
     * Identificador aparte del que asigna la base de datos. Este identificador se usa para no mostrar el id que 
     * asigna el manejador de base datos
     */
    countryId: { type: Number, required: true },

});
