import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootTestApp, randomEmail, extractCookie } from './test-helpers';

describe('Input validation (e2e)', () => {
  let app: INestApplication;
  let access = '';
  let slug = '';

  beforeAll(async () => {
    app = await bootTestApp();
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'Lawyer',
        email: randomEmail(),
        password: 'Password1',
        nombre_estudio: 'Study',
      });
    access = extractCookie(res.headers['set-cookie'] as any, 'access_token') ?? '';
    slug = res.body.estudio?.slug;
  });

  afterAll(async () => { await app.close(); });

  it('POST /consultas/publica/:slug rejects extra fields (forbidNonWhitelisted)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        nombre_cliente: 'Cliente Test',
        email: 'c@example.com',
        mensaje: 'Un mensaje de prueba lo suficientemente largo',
        estado: 'nuevo', // NOT in CreateConsultaDto — must be rejected
      });
    expect(res.status).toBe(400);
  });

  it('rejects tipo_caso value too long (> MaxLength)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        nombre_cliente: 'Cliente',
        email: 'c@example.com',
        mensaje: 'Mensaje válido suficiente',
        tipo_caso: 'x'.repeat(200),
      });
    expect(res.status).toBe(400);
  });

  it('rejects urgencia value not in enum', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        nombre_cliente: 'Cliente',
        email: 'c@example.com',
        mensaje: 'Mensaje válido suficiente',
        urgencia: 'EXTREMA', // not in UrgenciaConsulta
      });
    expect(res.status).toBe(400);
  });

  it('rejects email exceeding MaxLength', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        nombre_cliente: 'Cliente',
        email: 'x'.repeat(300) + '@example.com',
        mensaje: 'Mensaje válido suficiente',
      });
    expect(res.status).toBe(400);
  });

  it('PATCH /consultas/:id rejects estado=invalid_value', async () => {
    // Create a consulta first.
    const created = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        nombre_cliente: 'Cliente',
        email: 'c@example.com',
        mensaje: 'Mensaje válido suficiente',
      })
      .expect(201);
    const id = created.body.id;
    expect(id).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/api/consultas/${id}`)
      .set('Cookie', `access_token=${access}`)
      .send({ estado: 'invalid_value' })
      .expect(400);
  });

  it('validation 400 responses include structured error message', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slug}`)
      .send({
        email: 'not-an-email',
        mensaje: 'x', // too short
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('timestamp');
  });
});
