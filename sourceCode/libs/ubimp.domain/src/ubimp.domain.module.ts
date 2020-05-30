import { Module } from '@nestjs/common';
import { UbimpDomainService } from './ubimp.domain.service';

@Module({
  providers: [UbimpDomainService],
  exports: [UbimpDomainService],
})
export class UbimpDomainModule {}
