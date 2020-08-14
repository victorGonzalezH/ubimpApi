import { Test, TestingModule } from '@nestjs/testing';
import { UbimpApplicationService } from './ubimp.application.service';

describe('Ubimp.ApplicationService', () => {
  let service: UbimpApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UbimpApplicationService],
    }).compile();

    service = module.get<UbimpApplicationService>(UbimpApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
