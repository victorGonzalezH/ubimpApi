import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User } from '@ubd/ubimp.domain/users/user.entity';

@Injectable()
export class UserRepositoryService {

    constructor(@InjectModel('User') private readonly userModel: Model<User & Document>) {

    }


    public async findByUsername(username: string): Promise<User> {

      const user = await this.userModel.findOne( { username });
      if (!user) {
          throw new NotFoundException();
      }

      return { id: user.id, username: user.username, password: user.password };

    }
}
