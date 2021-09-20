import { Test, TestingModule } from '@nestjs/testing';
import { VehicleGroupRepositoryService } from './vehicle-group-repository.service';

describe('VehicleGroupRepositoryService', () => {
  let service: VehicleGroupRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleGroupRepositoryService],
    }).compile();

    service = module.get<VehicleGroupRepositoryService>(VehicleGroupRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
