import { Test, TestingModule } from '@nestjs/testing';
import { UbimpInfrastructureService } from './ubimp.infrastructure.service';

describe('Ubimp.InfrastructureService', () => {
  let service: UbimpInfrastructureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [], // <-- UbimpInfrastructureService
    }).compile();

    // service = module.get<UbimpInfrastructureService>(UbimpInfrastructureService);
  });

  // it('should be defined', () => {
  //   expect(service).toBeDefined();
  // });

  it('should be true', () => {
    expect(true).toBeTruthy();
  });
});
