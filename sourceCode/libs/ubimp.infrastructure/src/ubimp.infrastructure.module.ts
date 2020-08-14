import { Module } from '@nestjs/common';
import { UbimpInfrastructureService } from './ubimp.infrastructure.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesRepositoryService } from './persistence/messages.repository.service';

@Module({
  providers: [UbimpInfrastructureService],
  exports: [UbimpInfrastructureService],
})
export class UbimpInfrastructureModule {}
