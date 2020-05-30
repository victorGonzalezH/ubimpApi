import { Test, TestingModule } from '@nestjs/testing';
import { Ubimp.ApplicationService } from './ubimp.application.service';

describe('Ubimp.ApplicationService', () => {
  let service: Ubimp.ApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Ubimp.ApplicationService],
    }).compile();

    service = module.get<Ubimp.ApplicationService>(Ubimp.ApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
