import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ValidatedUserDto } from 'uba/ubimp.application/dataTransferObjects/validated-user-dto.model';
import * as bcrypt from 'bcrypt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { SignInCommand } from './signIn.command';
import { fstat } from 'fs';

// Aqui UbimpApplicationService tiene que importarse directamente ya que se importa desde
// todo el directorio uba/ubimp.application/ provoca error de dependencias circulares
// pues en ese directorio tambien se encuentra la clase AuthService
import { UbimpApplicationService } from 'uba/ubimp.application/ubimp.application.service';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { LoggedUserDto } from 'uba/ubimp.application/dataTransferObjects/logged-user-dto.model';
import { RefreshToken } from '@ubd/ubimp.domain/models/refresh-token.model';
import { User } from '@ubd/ubimp.domain/models/user.model';

@Injectable()
export class AuthService {

constructor(private jwtService: JwtService,
            private appConfigService: AppConfigService,
            private ubimpApplication: UbimpApplicationService) {

}

/**
 * Validates a user comparing username and password
 * @param username Nombre de usuario
 * @param password Contrasena
 */
async validateUser(username: string, password: string, systemId: string): Promise<ValidatedUserDto> {

  const user = await this.ubimpApplication.getUser(username);
  
  if (user) {
    const compareResult = bcrypt.compareSync(password, user.password);
    if (compareResult === true) {

        return { username, id: user._id, ownerId: user.ownerId, roles: user.systems[0].userRoles };
    }

    return null;
  }

  return null;

  }


  /**
   * Login a user
   * @param user 
   * @returns a LoggedUserDto
   */
  async login(validatedUser: ValidatedUserDto, ip: string): Promise<LoggedUserDto> {

    const payload = { username: validatedUser.username, sub: validatedUser.id };
    
    const authToken = await this.ubimpApplication.generateToken(payload, this.appConfigService.accessTokenOptions);
    
    const refreshToken = await this.ubimpApplication.generateRefreshToken(validatedUser.id, ip, true);
    
    return {
      token: authToken,
      username: validatedUser.username,
      refreshToken: refreshToken.token,
      roles: validatedUser.roles
    };
  }

  
  /**
   * 
   * @param token 
   * @returns 
   */
  async validateToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token)
  }

  /**
   * 
   * @param signInCommand
   */
  async signIn(signInCommand: SignInCommand) {
    return await this.ubimpApplication.addUserAndSendActivationEmail(signInCommand);
  }


  /**
   * 
   * @param refreshToken 
   * @param ipAddres 
   * @returns 
   */
  async refreshToken(refreshToken: string, ipAddres: string): Promise<LoggedUserDto> {
    
    try {

    const refreshTokenObject: RefreshToken = await this.ubimpApplication.getRefreshToken(refreshToken);
    
    if(refreshToken == null) throw new UnauthorizedException();

    // We get the user from the refreshToken
    const user: User = await this.ubimpApplication.getUserById(refreshTokenObject.userId);

    //generating new refresh token
    const newRefreshToken: RefreshToken = await this.ubimpApplication.generateRefreshToken(user._id, ipAddres, true);

    //We need to update the last refresh token
    const refreshTokenFilter = { token: refreshToken };
    const updatePart = {  revokedDate: Date.now(), revokedByIp: ipAddres, replacedByToken: newRefreshToken.token };
    await this.ubimpApplication.updateRefreshToken(refreshTokenFilter, updatePart);

    //Payload for auth token generation
    const payload = { username: user.username, sub: user.id };

    //Generating the authentication tokens
    const authToken = await this.ubimpApplication.generateToken(payload, this.appConfigService.accessTokenOptions);
    return {
      token: authToken,
      username: user.username,
      refreshToken: newRefreshToken.token,
      roles: user.roles
    }
    }
    catch(exception) {
      throw exception;
    }

  }

}

