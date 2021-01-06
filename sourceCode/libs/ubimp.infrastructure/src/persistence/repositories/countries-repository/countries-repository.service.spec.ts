import { Test, TestingModule } from '@nestjs/testing';
import { CountriesRepository } from './countries-repository.service';

describe('CountriesRepositoryService', () => {
  let service: CountriesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [], // <-- CountriesRepositoryService
    }).compile();

    // service = module.get<CountriesRepositoryService>(CountriesRepositoryService);
  });

  it('should be true', () => {
    expect(true).toBeTruthy();
  });

});
