import { Controller } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { UbimpApplicationService } from 'uba/ubimp.application';

@Controller('net')
export class NetController {


  constructor(private ubimpApp: UbimpApplicationService) {

  }

@EventPattern('Test', Transport.TCP)
//Record<string, unknown>
async handleUserCreated(data: string) {

  this.ubimpApp.processTcpDataAndSendToWebClients(data);

}

}
