import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepositoryService } from '@ubi/ubimp.infrastructure/users/user-repository.service';
import * as bcrypt from 'bcrypt';
import { IAuthenticatedUser } from 'uba/ubimp.application/models/iAuthenticatedUser.model';

@Injectable()
export class AuthService {

constructor(private userRepository: UserRepositoryService, private jwtService: JwtService) {

}

async validateUser(username: string, password: string): Promise<IAuthenticatedUser> {
    const user = await this.userRepository.findByUsername(username);
    if (user) {
      const compareResult = bcrypt.compareSync(password, user.password);
      if (compareResult === true) {
          return { username, id: user.id };
      }

      return null;
    }

    return null;
  }


  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

}
