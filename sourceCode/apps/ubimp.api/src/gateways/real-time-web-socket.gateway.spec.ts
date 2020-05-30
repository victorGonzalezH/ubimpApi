import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeWebSocketGateway } from './real-time-web-socket.gateway';

describe('RealTimeWebSocketGateway', () => {
  let gateway: RealTimeWebSocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealTimeWebSocketGateway],
    }).compile();

    gateway = module.get<RealTimeWebSocketGateway>(RealTimeWebSocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
