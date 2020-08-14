import { Test, TestingModule } from '@nestjs/testing';
import { UbimpDomainService } from './ubimp.domain.service';

describe('Ubimp.DomainService', () => {
  let service: UbimpDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UbimpDomainService],
    }).compile();

    service = module.get<UbimpDomainService>(UbimpDomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
