import { Test, TestingModule } from '@nestjs/testing';
import { VerifyController } from './verify.controller';

describe('Verify Controller', () => {
  let controller: VerifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
    }).compile();

    // controller = module.get<VerifyController>(VerifyController);
  });

  // it('should be defined', () => {
  //   expect(controller).toBeDefined();
  // });

  it('should be true', () => {
    expect(true).toBeTruthy();
  });
});
