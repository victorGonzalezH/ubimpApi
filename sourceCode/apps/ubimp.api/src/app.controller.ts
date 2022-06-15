import { Controller, Request, Response, UseGuards, Post, Body } from '@nestjs/common';
import { LocalAuthGuard } from 'uba/ubimp.application/services/auth/local-auth.guard';
import { SignInCommand } from 'uba/ubimp.application/services/auth/signIn.command';
import { AuthService } from 'uba/ubimp.application/services/auth/auth.service';
import { UbimpApplicationService } from 'uba/ubimp.application';
import { LoggedUserDto } from 'uba/ubimp.application/dataTransferObjects/logged-user-dto.model';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { HOURS_IN_A_DAY, MILISECONDS_IN_A_SECOND, MINUTES_IN_A_HOUR, SECONDS_IN_A_MINUTE } from 'utils';
import { JwtAuthGuard } from 'uba/ubimp.application/services/auth/auth.guard';


@Controller()
export class AppController {
  constructor(private authService: AuthService, private ubimpApplication: UbimpApplicationService,
    private appConfigService: AppConfigService) {}

  /**
   * Log in to the user. It uses the LocalAuthGuard to perform this operation, this
   * happen before the authService.login method is called, so the LocalAuthGuard
   * initializes the req.user object
   * 
   * @param req 
   * @returns 
   */
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req, @Response({ passthrough: true }) response): Promise<LoggedUserDto> {
    
    const loggedUserDto: LoggedUserDto = await this.authService.login(req.user, req.ip);
    
    // Se agrega el usuario autenticado a la aplicacion
    this.ubimpApplication.addAuthenticatedUsers(req.user.username, req.user.id, loggedUserDto.token, req.user.ownerId);

    // We use the refresh token expiration time as the cookie expiration time 
    const expire = new Date(Date.now() + this.appConfigService.refreshTokenOptions.expiresInDays * HOURS_IN_A_DAY * MINUTES_IN_A_HOUR * SECONDS_IN_A_MINUTE * MILISECONDS_IN_A_SECOND);
    
    //sets the refresh token to an http only cookie
    this.setTokenInCookie(response, this.appConfigService.refreshTokenOptions.name, loggedUserDto.refreshToken, expire, 'none', true);
    
    return loggedUserDto;
  }

 /**
  * Register a user
  * @param signInCommand 
  * @returns 
  */
  @Post('auth/signin')
  async sigIn(@Body() signInCommand: SignInCommand) {
    return await this.authService.signIn(signInCommand);
  }


  /**
   * 
   * @param req request
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth/refreshtoken')
  async refreshToken(@Request() req, @Response({ passthrough: true }) response) {
    const refreshToken = req.cookies['refreshToken'];
    const ipAddress = req.ip;
    
    //Getting refresh token
    const loggedUserDto: LoggedUserDto = await this.authService.refreshToken(refreshToken, ipAddress);

    // We use the refresh token expiration time as the cookie expiration time 
    const expire = new Date(Date.now() + this.appConfigService.refreshTokenOptions.expiresInDays * HOURS_IN_A_DAY * MINUTES_IN_A_HOUR * SECONDS_IN_A_MINUTE * MILISECONDS_IN_A_SECOND);
    
    //sets the refresh token to an http only cookie
    this.setTokenInCookie(response, this.appConfigService.refreshTokenOptions.name, loggedUserDto.refreshToken, expire, 'none', true);

    
    return loggedUserDto;
  }

  /** 
   * Sets a token in a http only cookie
   * @param response http response object
   * @param tokenName token name
   * @param token token
   * @param expires expiration time
   */
  private setTokenInCookie(response: any, tokenName: string, token: string, expire: Date, sameSite: string, secure: boolean): void {

    // create http only cookie with refresh token that expires in 7 days
    const cookieOptions = {
      httpOnly: true,
      expire: expire,
      sameSite: sameSite,
      secure: secure
  };

    response.cookie(tokenName, token, cookieOptions);

  }

}        
