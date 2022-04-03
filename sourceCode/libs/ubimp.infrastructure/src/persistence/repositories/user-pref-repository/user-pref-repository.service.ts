import { Injectable } from '@nestjs/common';
import { UserPreferences } from '@ubd/ubimp.domain/models/user-preferences-model';
import { MongoBaseRepository } from 'utils';

@Injectable()
export class UserPrefRepositoryService extends MongoBaseRepository<UserPreferences> {}
