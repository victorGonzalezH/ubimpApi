import { Test, TestingModule } from '@nestjs/testing';
import { Ubimp.DomainService } from './ubimp.domain.service';

describe('Ubimp.DomainService', () => {
  let service: Ubimp.DomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Ubimp.DomainService],
    }).compile();

    service = module.get<Ubimp.DomainService>(Ubimp.DomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
