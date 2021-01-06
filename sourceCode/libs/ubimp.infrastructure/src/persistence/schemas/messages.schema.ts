import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { Message } from '@ubd/ubimp.domain';
import { MessageSchema } from './message.schema';

export const MessagesSchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    lang: { type: String, required: true },
    messages:   [MessageSchema],

});
