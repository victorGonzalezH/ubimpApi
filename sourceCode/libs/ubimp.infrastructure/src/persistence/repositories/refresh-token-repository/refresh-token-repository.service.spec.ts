import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenRepositoryService } from './refresh-token-repository.service';

describe('RefreshTokenRepositoryService', () => {
  let service: RefreshTokenRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenRepositoryService],
    }).compile();

    service = module.get<RefreshTokenRepositoryService>(RefreshTokenRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
