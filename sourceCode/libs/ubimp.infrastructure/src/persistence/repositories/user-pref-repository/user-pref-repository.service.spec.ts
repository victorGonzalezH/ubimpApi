import { Test, TestingModule } from '@nestjs/testing';
import { UserPrefRepositoryService } from './user-pref-repository.service';

describe('UserPrefRepositoryService', () => {
  let service: UserPrefRepositoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPrefRepositoryService],
    }).compile();

    service = module.get<UserPrefRepositoryService>(UserPrefRepositoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
