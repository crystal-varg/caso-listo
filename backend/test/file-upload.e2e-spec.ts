import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { bootTestApp, randomEmail, extractCookie } from './test-helpers';

function pdfBuffer(size = 1024): Buffer {
  const header = Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n');
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

function exeBuffer(): Buffer {
  // "MZ" PE header — standard Windows executable.
  return Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(1022)]);
}

function bigBuffer(sizeBytes: number): Buffer {
  // A valid PDF prefix followed by padding to force the size limit.
  const header = Buffer.from('%PDF-1.7\n');
  return Buffer.concat([header, Buffer.alloc(Math.max(0, sizeBytes - header.length), 0x20)]);
}

describe('File upload security (e2e)', () => {
  let app: INestApplication;
  let accessA = '';
  let accessOther = '';
  let slugA = '';
  let storedFilename = '';

  beforeAll(async () => {
    app = await bootTestApp();

    const ra = await request(app.getHttpServer()).post('/api/auth/register').send({
      nombre: 'A', email: randomEmail(), password: 'Password1', nombre_estudio: 'A',
    });
    accessA = extractCookie(ra.headers['set-cookie'] as any, 'access_token') ?? '';
    slugA = ra.body.estudio.slug;

    const rb = await request(app.getHttpServer()).post('/api/auth/register').send({
      nombre: 'B', email: randomEmail(), password: 'Password1', nombre_estudio: 'B',
    });
    accessOther = extractCookie(rb.headers['set-cookie'] as any, 'access_token') ?? '';
  });

  afterAll(async () => { await app.close(); });

  it('uploads a valid PDF successfully and stores a UUID-style filename', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slugA}`)
      .field('nombre_cliente', 'Cliente')
      .field('email', 'c@example.com')
      .field('mensaje', 'Un mensaje lo suficientemente largo para validar')
      .attach('dni_archivo', pdfBuffer(2048), { filename: 'original.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(res.body.ok).toBe(true);

    // Fetch consulta detail as the owner to learn the stored filename.
    const list = await request(app.getHttpServer())
      .get('/api/consultas')
      .set('Cookie', `access_token=${accessA}`)
      .expect(200);
    const found = list.body.find((c: any) => c.id === res.body.id);
    storedFilename = found.dni_archivo;
    expect(storedFilename).toMatch(/^[a-f0-9-]{10,60}\.pdf$/i);
    // Original filename is never persisted.
    expect(storedFilename).not.toContain('original');
  });

  it('rejects a .exe masquerading as application/pdf (magic-byte check)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slugA}`)
      .field('nombre_cliente', 'Cliente')
      .field('email', 'c@example.com')
      .field('mensaje', 'Mensaje válido y largo suficiente')
      .attach('dni_archivo', exeBuffer(), { filename: 'evil.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  it('rejects files > 5 MB with 413 (multer fileSize limit)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consultas/publica/${slugA}`)
      .field('nombre_cliente', 'Cliente')
      .field('email', 'c@example.com')
      .field('mensaje', 'Mensaje válido y largo suficiente')
      .attach('dni_archivo', bigBuffer(6 * 1024 * 1024), {
        filename: 'big.pdf',
        contentType: 'application/pdf',
      });
    // Multer may surface the error as 400 or 413 depending on NestJS error mapping;
    // both are acceptable rejections for oversized files.
    expect([400, 413]).toContain(res.status);
  });

  it('GET /consultas/archivos/<name> without cookie returns 401', async () => {
    await request(app.getHttpServer())
      .get(`/api/consultas/archivos/${storedFilename}`)
      .expect(401);
  });

  it('GET /consultas/archivos/<name> by another authenticated user returns 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/consultas/archivos/${storedFilename}`)
      .set('Cookie', `access_token=${accessOther}`)
      .expect(404);
  });

  it('GET /consultas/archivos/../../etc/passwd returns 400 (path traversal blocked)', async () => {
    // Supertest won't send literal `..` as a path segment without encoding, so
    // we assert against an encoded traversal attempt.
    await request(app.getHttpServer())
      .get('/api/consultas/archivos/..%2F..%2Fetc%2Fpasswd')
      .set('Cookie', `access_token=${accessA}`)
      .expect(400);
  });

  it('owner CAN download their own file', async () => {
    await request(app.getHttpServer())
      .get(`/api/consultas/archivos/${storedFilename}`)
      .set('Cookie', `access_token=${accessA}`)
      .expect(200);
  });
});

describe('Public intake — slug behaviour', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await bootTestApp(); });
  afterAll(async () => { await app.close(); });

  it("POST /consultas/publica/admin returns 404 (blocklisted)", async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consultas/publica/admin')
      .send({ nombre_cliente: 'X', email: 'x@x.com', mensaje: 'xxxxxxxxxxxx' });
    expect(res.status).toBe(404);
  });

  it('POST /consultas/publica/<malformed> returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consultas/publica/..%2Fetc%2Fpasswd')
      .send({ nombre_cliente: 'X', email: 'x@x.com', mensaje: 'xxxxxxxxxxxx' });
    expect(res.status).toBe(400);
  });

  it('POST /consultas/publica/<non-existent-but-well-formed> returns 200 success-shaped (anti-enumeration)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consultas/publica/estudio-0123456789abcdef')
      .send({ nombre_cliente: 'X', email: 'x@x.com', mensaje: 'mensajemensajemensaje' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeNull();
  });
});
