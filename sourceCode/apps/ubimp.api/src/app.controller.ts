import { Controller, Request, UseGuards, Post, Body } from '@nestjs/common';
import { LocalAuthGuard } from 'uba/ubimp.application/services/auth/local-auth.guard';
import { SignInCommand } from 'uba/ubimp.application/services/auth/signIn.command';
import { AuthService } from 'uba/ubimp.application/services/auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {

    return this.authService.login(req.user);
    // "systemId": "5ee56542627a3942b831937b"

  }


  @Post('auth/signIn')
  async sigIn(@Body() signInCommand: SignInCommand) {

    return await this.authService.signIn(signInCommand);
  }

}
