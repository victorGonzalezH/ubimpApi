import { Test, TestingModule } from '@nestjs/testing';
import { Ubimp.InfrastructureService } from './ubimp.infrastructure.service';

describe('Ubimp.InfrastructureService', () => {
  let service: Ubimp.InfrastructureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Ubimp.InfrastructureService],
    }).compile();

    service = module.get<Ubimp.InfrastructureService>(Ubimp.InfrastructureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
