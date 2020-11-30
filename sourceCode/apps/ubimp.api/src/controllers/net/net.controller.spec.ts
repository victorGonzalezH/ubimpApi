import { Test, TestingModule } from '@nestjs/testing';
import { NetController } from './net.controller';

describe('Net Controller', () => {
  let controller: NetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NetController],
    }).compile();

    controller = module.get<NetController>(NetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
