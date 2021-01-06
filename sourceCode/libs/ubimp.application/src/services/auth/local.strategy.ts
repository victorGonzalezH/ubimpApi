import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { LoginCommand } from 'uba/ubimp.application/commands/login.command';
import {validate } from 'class-validator';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, private appConfigService: AppConfigService) {
    super({ passReqToCallback: true });
  }

  /**
   * 
   * @param req objeto request. Dado que la estrategia passport-local solo admite como parametros username y password
   * entonces se pasa el objeto request completo, de ahi, se accede al body y se lee la propiedad systemId
   * @param username nombre de usuario
   * @param password contrasena
   */
  async validate(req: any, username: string, password: string): Promise<any> {
  try {
    // const systemId: string = req.body.systemId;
    const loginCommand = new LoginCommand(username, password);
    // Valida el comando login
    const validationError = await validate(loginCommand);
    if (validationError.length > 0) {

      // throw new BadRequestException();
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }

    const user = await this.authService.validateUser(username, password, this.appConfigService.getSystemId());
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  } catch (exception) {
    if ( exception instanceof UnauthorizedException ) {
      throw exception;
    }

    if (exception.message) {
      if ( (exception.message as string).includes('BadRequest') ) {
          // throw new BadRequestException();
          throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
       }

      if ( (exception.message as string).includes('InternalServerError') ) {
        throw new InternalServerErrorException();
     }

      throw exception;
    }

    throw exception;
  }
}

}
