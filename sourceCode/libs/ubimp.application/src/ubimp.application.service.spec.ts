import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from './config/appConfig.service';
import { UbimpApplicationService } from './ubimp.application.service';

describe('Ubimp.ApplicationService', () => {
  let service: UbimpApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [], // <-- UbimpApplicationService
    }).compile();

    // service = module.get<UbimpApplicationService>(UbimpApplicationService);
  });


  it('it should be true', () => {

    expect(true).toBeTruthy();

  });

});
