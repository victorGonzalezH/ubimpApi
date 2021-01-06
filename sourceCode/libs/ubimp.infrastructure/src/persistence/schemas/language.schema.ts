import * as mongoose from 'mongoose';
import { MessageSchema } from './message.schema';

export const LanguageSchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    lang: { type: String, required: true },
    displayLang: { type: String, required: true }, // Texto del lenguaje se desea mostrar en algun frontend/mobile
    messages:   [MessageSchema],

});
