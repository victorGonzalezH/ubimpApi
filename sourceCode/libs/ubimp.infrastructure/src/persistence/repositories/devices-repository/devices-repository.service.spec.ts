import { Test, TestingModule } from '@nestjs/testing';
import { DevicesRepositoryService } from './devices-repository.service';

describe('DevicesRepositoryService', () => {
  let service: DevicesRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicesRepositoryService],
    }).compile();

    service = module.get<DevicesRepositoryService>(DevicesRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
