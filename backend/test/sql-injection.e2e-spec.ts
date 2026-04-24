import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { bootTestApp, randomEmail, extractCookie } from './test-helpers';

describe('SQL injection defence (e2e)', () => {
  let app: INestApplication;
  let access = '';

  beforeAll(async () => {
    app = await bootTestApp();
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'SQL Test',
        email: randomEmail(),
        password: 'Password1',
        nombre_estudio: 'SQL Estudio',
      });
    access = extractCookie(res.headers['set-cookie'] as any, 'access_token') ?? '';
  });

  afterAll(async () => { await app.close(); });

  it("GET /consultas?estado='; DROP TABLE ...  returns 400", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/consultas?estado=';%20DROP%20TABLE%20consultas;--")
      .set('Cookie', `access_token=${access}`);
    expect(res.status).toBe(400);
  });

  it('GET /consultas?fuero=<invalid> returns 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consultas?fuero=no-existe')
      .set('Cookie', `access_token=${access}`);
    expect(res.status).toBe(400);
  });

  it('findSinMovimiento uses parameterized SQL — static audit', () => {
    // Static-source audit: the only raw SQL in ConsultasService uses $1 bindings.
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'consultas', 'consultas.service.ts'),
      'utf-8',
    );
    // Find the query() call and verify no `${...}` interpolation.
    const queryBlock = src.slice(src.indexOf('.query(')).split('.query(')[1].split(');')[0];
    expect(queryBlock).toContain('$1');
    expect(queryBlock).not.toMatch(/\$\{[^}]+\}/);
  });

  it('findSinMovimiento endpoint returns an array for the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consultas/sin-movimiento')
      .set('Cookie', `access_token=${access}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
