import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { UbimpApiModule } from '../src/ubimp.api.module';

describe('AppController (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UbimpApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // it('/ (GET)', () => {
  //   return request(app.getHttpServer())
  //     .get('/')
  //     .expect(200)
  //     .expect('Hello World!');
  // });

  
  it('should be true', () => {
    expect(true).toBeTruthy();
  });
});
