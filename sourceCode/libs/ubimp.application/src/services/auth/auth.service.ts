import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUserDto } from 'uba/ubimp.application/dataTransferObjects/authenticated-user.dto';
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
async validateUser(username: string, password: string, systemId: string): Promise<AuthenticatedUserDto> {

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
    const token = this.jwtService.sign(payload);
    console.log('token')
    console.log(token);
    // Se agrega el usuario autenticado a la aplicacion
    this.ubimpApplication.addAuthenticatedUsers(user.username, token);
    // Se regresa el token
    return {
      token
    };
  }

  
  async validateToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token)
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
