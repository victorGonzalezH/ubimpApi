import * as mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    code: { type: String, required: true },
    value: { type: String, required: true },

});
