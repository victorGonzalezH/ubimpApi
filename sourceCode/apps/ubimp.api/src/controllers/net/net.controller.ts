import { Controller } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';

@Controller('net')
export class NetController {

@EventPattern('Test', Transport.TCP)
async handleUserCreated(data: Record<string, unknown>) {
  console.log(data);
}

}
