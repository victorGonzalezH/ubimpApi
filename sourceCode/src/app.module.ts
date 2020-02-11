import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UbimpApiModule } from './ubimp.api/ubimp.api.module';
import { UbimpDomainModule } from './ubimp.domain/ubimp.domain.module';
import { UbimpInfrastructureModule } from './ubimp.infrastructure/ubimp.infrastructure.module';
import { RealTimeGateway } from './ubimp.api/gateways/real-time.gateway';

@Module({
  imports: [UbimpApiModule, UbimpDomainModule, UbimpInfrastructureModule],
  controllers: [AppController],
  providers: [AppService, Logger ],
})
export class AppModule {}
