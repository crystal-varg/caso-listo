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
describe('Input validation (e2e)', () => {
    let app;
    let access = '';
    let slug = '';
    beforeAll(async () => {
        app = await (0, test_helpers_1.bootTestApp)();
        const res = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
            nombre: 'Lawyer',
            email: (0, test_helpers_1.randomEmail)(),
            password: 'Password1',
            nombre_estudio: 'Study',
        });
        access = (0, test_helpers_1.extractCookie)(res.headers['set-cookie'], 'access_token') ?? '';
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
            estado: 'nuevo',
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
            urgencia: 'EXTREMA',
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
            mensaje: 'x',
        });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('timestamp');
    });
});
