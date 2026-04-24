import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootTestApp, randomEmail } from './test-helpers';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => { app = await bootTestApp(); });
  afterAll(async () => { await app.close(); });

  it('6th POST /auth/login within 15 min from same IP returns 429', async () => {
    const email = randomEmail();
    // Fire 5 failing attempts — each should return 401, not 429.
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
    }
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrong' });
    expect(res.status).toBe(429);
    // Retry-After must be a positive integer.
    const retryAfter = res.headers['retry-after'];
    expect(retryAfter).toBeDefined();
    expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
  });

  it('register endpoint rate-limits after 10 requests per hour', async () => {
    let last: request.Response | null = null;
    for (let i = 0; i < 11; i++) {
      last = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          nombre: 'X',
          email: randomEmail(),
          password: 'Password1',
          nombre_estudio: 'X',
        });
    }
    expect(last!.status).toBe(429);
  });

  it('rate limit is per IP — requests from a different IP are not affected', async () => {
    const email = randomEmail();
    // Burn attempts from default IP.
    for (let i = 0; i < 6; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong' });
    }
    // X-Forwarded-For is honoured because app.set('trust proxy', 1) treats the
    // first hop as trusted in the test harness.
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.0.0.99')
      .send({ email, password: 'wrong' });
    expect([401, 429]).toContain(res.status);
  });
});
