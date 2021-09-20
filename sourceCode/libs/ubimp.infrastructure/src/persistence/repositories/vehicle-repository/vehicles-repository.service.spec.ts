import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesRepository } from './vehicles-repository.service';

describe('VehicleRepositoryService', () => {
  let service: VehiclesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehiclesRepository],
    }).compile();

    service = module.get<VehiclesRepository>(VehiclesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
