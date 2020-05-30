import { Module } from '@nestjs/common';
import { UbimpApplicationService } from './ubimp.application.service';
import { AuthService } from './services/auth/auth.service';

@Module({
  providers: [UbimpApplicationService, AuthService],
  exports: [UbimpApplicationService],
})
export class UbimpApplicationModule {}
