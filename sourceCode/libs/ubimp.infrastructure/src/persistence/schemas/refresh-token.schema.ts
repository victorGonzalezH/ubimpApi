import { RefreshToken } from '@ubd/ubimp.domain/models/refresh-token.model';
import * as mongoose from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

/**
 * Refresh token schema
 */
const RefreshTokenSchema = new mongoose.Schema({
    // id mongo se encarga de agregar la propiedad _id
    userId: { type: String, required: true },
    token: { type: String, required: true },
    created: { type: Date, default: Date.now, required: true },
    expires: { type: Date, required: true  },
    createdByIp: { type: String, required: true },
    revokedDate: { type: Date, required: false },
    revokedByIp: { type: String, required: false },
    replacedByToken: { type: String, required: false },
});

RefreshTokenSchema.virtual('isExpired').get( function(this: RefreshTokenDocument ){
    return  new Date(Date.now()) >= this.expires;
});


RefreshTokenSchema.virtual('isValid').get( function(this: RefreshTokenDocument ){
    return !this.revokedDate && !this.isExpired;
});


export { RefreshTokenSchema };
