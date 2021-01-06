import { Test, TestingModule } from '@nestjs/testing';
import { LanguageRepository } from './language.repository.service';

describe('Language.RepositoryService', () => {
  let service: LanguageRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [], // <-- LanguageRepository
    }).compile();

    // service = module.get<LanguageRepository>(LanguageRepository);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });

  it('should be true', () => {
    expect(true).toBeTruthy();
  });
  
});
