"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const request = __importStar(require("supertest"));
const test_helpers_1 = require("./test-helpers");
function pdfBuffer(size = 1024) {
    const header = Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n');
    const body = Buffer.alloc(size - header.length, 0x20);
    return Buffer.concat([header, body]);
}
function exeBuffer() {
    return Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(1022)]);
}
function bigBuffer(sizeBytes) {
    const header = Buffer.from('%PDF-1.7\n');
    return Buffer.concat([header, Buffer.alloc(Math.max(0, sizeBytes - header.length), 0x20)]);
}
describe('File upload security (e2e)', () => {
    let app;
    let accessA = '';
    let accessOther = '';
    let slugA = '';
    let storedFilename = '';
    beforeAll(async () => {
        app = await (0, test_helpers_1.bootTestApp)();
        const ra = await request(app.getHttpServer()).post('/api/auth/register').send({
            nombre: 'A', email: (0, test_helpers_1.randomEmail)(), password: 'Password1', nombre_estudio: 'A',
        });
        accessA = (0, test_helpers_1.extractCookie)(ra.headers['set-cookie'], 'access_token') ?? '';
        slugA = ra.body.estudio.slug;
        const rb = await request(app.getHttpServer()).post('/api/auth/register').send({
            nombre: 'B', email: (0, test_helpers_1.randomEmail)(), password: 'Password1', nombre_estudio: 'B',
        });
        accessOther = (0, test_helpers_1.extractCookie)(rb.headers['set-cookie'], 'access_token') ?? '';
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
        const list = await request(app.getHttpServer())
            .get('/api/consultas')
            .set('Cookie', `access_token=${accessA}`)
            .expect(200);
        const found = list.body.find((c) => c.id === res.body.id);
        storedFilename = found.dni_archivo;
        expect(storedFilename).toMatch(/^[a-f0-9-]{10,60}\.pdf$/i);
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
    let app;
    beforeAll(async () => { app = await (0, test_helpers_1.bootTestApp)(); });
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
