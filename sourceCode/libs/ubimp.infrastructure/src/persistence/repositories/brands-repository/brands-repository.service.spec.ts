import { Test, TestingModule } from '@nestjs/testing';
import { BrandsRepositoryService } from './brands-repository.service';

describe('BrandsRepositoryService', () => {
  let service: BrandsRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrandsRepositoryService],
    }).compile();

    service = module.get<BrandsRepositoryService>(BrandsRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
