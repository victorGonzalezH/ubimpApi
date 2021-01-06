import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthenticatedUser } from 'uba/ubimp.application/models/iAuthenticatedUser.model';
import * as bcrypt from 'bcrypt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { SignInCommand } from './signIn.command';
import { fstat } from 'fs';

// Aqui UbimpApplicationService tiene que importarse directamente ya que se importa desde
// todo el directorio uba/ubimp.application/ provoca error de dependencias circulares
// pues en ese directorio tambien se encuentra la clase AuthService
import { UbimpApplicationService } from 'uba/ubimp.application/ubimp.application.service';

@Injectable()
export class AuthService {

constructor(private jwtService: JwtService,
            private ubimpApplication: UbimpApplicationService) {

}

/**
 * 
 * @param username Nombre de usuario
 * @param password Contrasena
 */
async validateUser(username: string, password: string, systemId: string): Promise<IAuthenticatedUser> {

  const user = await this.ubimpApplication.getUser(username);
  if (user) {
    const compareResult = bcrypt.compareSync(password, user.password);
    if (compareResult === true) {
        return { username, id: user._id };
    }

    return null;
  }

  return null;

  // const pattern = { command: 'getByUsername' };
  // const payload = { callSource: 1, username, systemId};
  // const user = await this.client.send(pattern, payload).toPromise()
  // .catch(exception => {
  //     throw exception;
  // });

  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  /**
   * 
   * @param signInCommand
   */
  async signIn(signInCommand: SignInCommand) {
    return await this.ubimpApplication.addUserAndSendActivationEmail(signInCommand);

    //
    // const pattern = { command: 'save' };
    // const payload = { callSource: 1, saveUserCommand: signInCommand};
    // const user = await this.infrastructureClient.send(pattern, payload).toPromise()
    // .catch(exception => {
    //   throw exception;
    // });
  }

}
