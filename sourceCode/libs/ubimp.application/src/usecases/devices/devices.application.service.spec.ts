import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from 'uba/ubimp.application/config/appConfig.service';
import { SendSMSCommand } from './commands/send-sms.command';
import { DevicesApplication } from './devices.application.service';
import { SmsTypes } from './enums/sms-types.enum';

describe('Devices.ApplicationService', () => {
  let service: DevicesApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicesApplication, ConfigService, AppConfigService, {
        provide: 'INFRASTRUCTURE_SERVICE',
        useFactory: (appConfigService: AppConfigService) => {
        return ClientProxyFactory.create({transport: Transport.TCP, options: { host: '127.0.0.1', port: 8002  }});
        },
        inject: [AppConfigService, ConfigService],
      }],
    }).compile();

    service = module.get<DevicesApplication>(DevicesApplication);

  });

  it('sendSMS_result_true', async () => {

    const sendSMSCommand: SendSMSCommand = { message: 'Hola desde nestjs', phoneNumber: '+529931321441', senderId: 'test', smsType: SmsTypes.Transactional };
    const result = await service.sendSMS(sendSMSCommand).toPromise();
    expect(result.IsSuccess).toBe(true);

  });

});
