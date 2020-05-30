import { Module } from '@nestjs/common';
import { UbimpInfrastructureService } from './ubimp.infrastructure.service';
//import { UsersService } from './src/repositories/users/users.service';
import { UserRepositoryService } from './users/user-repository.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './users/user.schema';

@Module({
  imports: [ MongooseModule.forFeature([
                            { name: 'User', schema: UserSchema }] ) ],
  providers: [UbimpInfrastructureService, UserRepositoryService],
  exports: [UbimpInfrastructureService, UserRepositoryService],
})
export class UbimpInfrastructureModule {}
