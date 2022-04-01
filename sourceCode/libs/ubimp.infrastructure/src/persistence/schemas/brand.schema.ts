import * as mongoose from 'mongoose';
import { BrandModelSchema } from './brand-model.schema';

export const BrandSchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    
    displayName: { type: String, required: true },    
    
    visible: { type: Boolean, required: true },

    order: { type: Number, required: true },

    enabled: { type: Boolean, required: true },

    models : { type: [BrandModelSchema], required: false }

});
