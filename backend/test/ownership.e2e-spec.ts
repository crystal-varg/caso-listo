import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootTestApp, randomEmail, extractCookie } from './test-helpers';

describe('Ownership (e2e) — cross-tenant access returns 404 (never 403)', () => {
  let app: INestApplication;
  let accessA = '';
  let accessB = '';
  let consultaB = 0;
  let honorarioB = 0;
  let eventoB = 0;
  let slugB = '';

  beforeAll(async () => {
    app = await bootTestApp();

    // User A
    const ra = await request(app.getHttpServer()).post('/api/auth/register').send({
      nombre: 'A', email: randomEmail(), password: 'Password1', nombre_estudio: 'A',
    });
    accessA = extractCookie(ra.headers['set-cookie'] as any, 'access_token') ?? '';

    // User B — seed a consulta, honorario, evento
    const rb = await request(app.getHttpServer()).post('/api/auth/register').send({
      nombre: 'B', email: randomEmail(), password: 'Password1', nombre_estudio: 'B',
    });
    accessB = extractCookie(rb.headers['set-cookie'] as any, 'access_token') ?? '';
    slugB = rb.body.estudio.slug;

    const cons = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slugB}`)
      .send({
        nombre_cliente: 'Cliente B',
        email: 'cliente@b.com',
        mensaje: 'Un mensaje largo suficiente',
      })
      .expect(201);
    consultaB = cons.body.id;

    const hon = await request(app.getHttpServer())
      .post('/api/honorarios')
      .set('Cookie', `access_token=${accessB}`)
      .send({
        consulta_id: consultaB,
        monto_total: 100,
        fecha_vencimiento: '2099-12-31',
      })
      .expect(201);
    honorarioB = hon.body.id;

    const ev = await request(app.getHttpServer())
      .post('/api/eventos')
      .set('Cookie', `access_token=${accessB}`)
      .send({
        consulta_id: consultaB,
        titulo: 'Audiencia B',
        tipo: 'audiencia',
        fecha: new Date().toISOString(),
      })
      .expect(201);
    eventoB = ev.body.id;
  });

  afterAll(async () => { await app.close(); });

  it("GET /consultas/:id of another user returns 404", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/consultas/${consultaB}`)
      .set('Cookie', `access_token=${accessA}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /consultas/:id of another user returns 404', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/consultas/${consultaB}`)
      .set('Cookie', `access_token=${accessA}`)
      .send({ estado: 'en_proceso' });
    expect(res.status).toBe(404);
  });

  it('DELETE /honorarios/:id of another user returns 404', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/honorarios/${honorarioB}`)
      .set('Cookie', `access_token=${accessA}`);
    expect(res.status).toBe(404);
  });

  it("GET /actividad?consulta_id=<B's> returns 404 for A", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/actividad?consulta_id=${consultaB}`)
      .set('Cookie', `access_token=${accessA}`);
    expect(res.status).toBe(404);
  });

  it("GET /eventos?consulta_id=<B's> returns empty array for A (filter is inner-joined)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/eventos?consulta_id=${consultaB}`)
      .set('Cookie', `access_token=${accessA}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it("PATCH /eventos/:id of another user returns 404", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/eventos/${eventoB}`)
      .set('Cookie', `access_token=${accessA}`)
      .send({ completado: true });
    expect(res.status).toBe(404);
  });

  it('GET /consultas/:id that does not exist returns 404 (same as ownership failure — no oracle)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consultas/99999999')
      .set('Cookie', `access_token=${accessA}`);
    expect(res.status).toBe(404);
  });
});
