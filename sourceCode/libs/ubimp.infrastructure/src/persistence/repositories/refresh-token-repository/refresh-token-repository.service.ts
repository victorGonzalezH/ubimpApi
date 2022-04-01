import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from '@ubd/ubimp.domain/models/refresh-token.model';
import { Model, Document } from 'mongoose';
import { MongoBaseRepository } from 'utils';

/**
 * Refresh token model
 */
@Injectable()
export class RefreshTokenRepository extends MongoBaseRepository<RefreshToken> { 
    
    constructor(@InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshToken & Document>) {
        super(refreshTokenModel);
    }
}
