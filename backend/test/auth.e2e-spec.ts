import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootTestApp, randomEmail, extractCookie } from './test-helpers';

/**
 * Auth e2e — cookie-only JWT, refresh rotation, header rejection.
 *
 * These tests require a running PostgreSQL DB (uses TypeORM `synchronize`).
 * In CI, spin one up via docker-compose or a service container.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = randomEmail();
  const password = 'TestPassword1';
  let accessCookie = '';
  let refreshCookie = '';

  beforeAll(async () => {
    app = await bootTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register sets httpOnly cookies and does NOT include access_token in body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'Tester',
        email,
        password,
        nombre_estudio: 'Estudio Test',
      })
      .expect(201);

    expect(res.body).not.toHaveProperty('access_token');
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body).not.toHaveProperty('refreshToken');
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario).not.toHaveProperty('password');

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(extractCookie(setCookie, 'access_token')).toBeDefined();
    expect(extractCookie(setCookie, 'refresh_token')).toBeDefined();
    // httpOnly flag must be present
    const accessRaw = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((c) =>
      c.startsWith('access_token='),
    )!;
    expect(accessRaw.toLowerCase()).toContain('httponly');
    expect(accessRaw.toLowerCase()).toContain('samesite=strict');
  });

  it('POST /auth/login sets cookies and returns usuario/estudio only', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body).not.toHaveProperty('access_token');
    expect(res.body).not.toHaveProperty('accessToken');
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario).not.toHaveProperty('password');

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    accessCookie = extractCookie(setCookie, 'access_token') ?? '';
    refreshCookie = extractCookie(setCookie, 'refresh_token') ?? '';
    expect(accessCookie).toBeTruthy();
    expect(refreshCookie).toBeTruthy();
  });

  it('GET /auth/me without cookie returns 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('GET /auth/me with Authorization: Bearer header is rejected with 401', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessCookie}`)
      .expect(401);
  });

  it('GET /auth/me with cookie returns usuario (no password)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${accessCookie}`)
      .expect(200);

    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario).not.toHaveProperty('password');
  });

  it('POST /auth/refresh rotates the refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshCookie}`)
      .expect(200);

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const newRefresh = extractCookie(setCookie, 'refresh_token');
    expect(newRefresh).toBeDefined();
    expect(newRefresh).not.toEqual(refreshCookie);

    // The OLD refresh should no longer work (rotation + invalidation).
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshCookie}`)
      .expect(401);

    refreshCookie = newRefresh!;
  });

  it('POST /auth/refresh with random/invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=not-a-real-token')
      .expect(401);
  });

  it('POST /auth/refresh with no cookie returns 401', async () => {
    await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
  });

  it('POST /auth/logout clears both cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `refresh_token=${refreshCookie}`)
      .expect(204);

    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.join(' ')).toContain('access_token=');
    expect(setCookie.join(' ')).toContain('refresh_token=');
  });
});

describe('Auth — password hash exposure', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await bootTestApp(); });
  afterAll(async () => { await app.close(); });

  it('none of the auth endpoints serialize a `password` field at any depth', async () => {
    const email = randomEmail();
    const password = 'TestPassword1';

    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ nombre: 'X', email, password, nombre_estudio: 'X' })
      .expect(201);
    expect(JSON.stringify(register.body)).not.toMatch(/"password"/i);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    expect(JSON.stringify(login.body)).not.toMatch(/"password"/i);

    const access = extractCookie(login.headers['set-cookie'] as any, 'access_token') ?? '';

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${access}`)
      .expect(200);
    expect(JSON.stringify(me.body)).not.toMatch(/"password"/i);

    const profile = await request(app.getHttpServer())
      .patch('/api/auth/profile')
      .set('Cookie', `access_token=${access}`)
      .send({ nombre: 'Renombrado' })
      .expect(200);
    expect(JSON.stringify(profile.body)).not.toMatch(/"password"/i);
  });
});
