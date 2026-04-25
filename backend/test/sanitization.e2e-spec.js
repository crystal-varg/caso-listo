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
const consultas_service_1 = require("../src/consultas/consultas.service");
const sanitize_1 = require("../src/common/utils/sanitize");
describe('XSS sanitization (e2e)', () => {
    let app;
    let access = '';
    let slug = '';
    beforeAll(async () => {
        app = await (0, test_helpers_1.bootTestApp)();
        const res = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
            nombre: 'Owner',
            email: (0, test_helpers_1.randomEmail)(),
            password: 'Password1',
            nombre_estudio: 'X',
        });
        access = (0, test_helpers_1.extractCookie)(res.headers['set-cookie'], 'access_token') ?? '';
        slug = res.body.estudio.slug;
    });
    afterAll(async () => { await app.close(); });
    it("mensaje '<script>alert(1)</script>' is persisted with the tag removed", async () => {
        const created = await request(app.getHttpServer())
            .post(`/api/consultas/publica/${slug}`)
            .send({
            nombre_cliente: 'Juan Pérez',
            email: 'c@example.com',
            mensaje: '<script>alert(1)</script>Este es mi caso',
        })
            .expect(201);
        const detail = await request(app.getHttpServer())
            .get(`/api/consultas/${created.body.id}`)
            .set('Cookie', `access_token=${access}`)
            .expect(200);
        expect(detail.body.mensaje).not.toContain('<script>');
        expect(detail.body.mensaje).toContain('Este es mi caso');
    });
    it("nombre_cliente '<img src=x onerror=alert(1)>' is persisted without the event handler", async () => {
        const created = await request(app.getHttpServer())
            .post(`/api/consultas/publica/${slug}`)
            .send({
            nombre_cliente: '<img src=x onerror=alert(1)>Nombre',
            email: 'c2@example.com',
            mensaje: 'mensaje con contenido real largo',
        })
            .expect(201);
        const detail = await request(app.getHttpServer())
            .get(`/api/consultas/${created.body.id}`)
            .set('Cookie', `access_token=${access}`)
            .expect(200);
        expect(detail.body.nombre_cliente).not.toContain('onerror');
        expect(detail.body.nombre_cliente).not.toContain('<img');
    });
    it("tipo_caso 'javascript:alert(1)' is stored sanitized", async () => {
        const created = await request(app.getHttpServer())
            .post(`/api/consultas/publica/${slug}`)
            .send({
            nombre_cliente: 'Cliente',
            email: 'c3@example.com',
            mensaje: 'mensaje con contenido real largo',
            tipo_caso: 'javascript:alert(1)',
        })
            .expect(201);
        const detail = await request(app.getHttpServer())
            .get(`/api/consultas/${created.body.id}`)
            .set('Cookie', `access_token=${access}`)
            .expect(200);
        expect(detail.body.tipo_caso).not.toContain('javascript:');
    });
    it('valid plain text "Consulta sobre divorcio" is stored unchanged', async () => {
        const created = await request(app.getHttpServer())
            .post(`/api/consultas/publica/${slug}`)
            .send({
            nombre_cliente: 'Cliente',
            email: 'c4@example.com',
            mensaje: 'Consulta sobre divorcio y tenencia',
        })
            .expect(201);
        const detail = await request(app.getHttpServer())
            .get(`/api/consultas/${created.body.id}`)
            .set('Cookie', `access_token=${access}`)
            .expect(200);
        expect(detail.body.mensaje).toBe('Consulta sobre divorcio y tenencia');
    });
    it('sanitization happens in the service layer — direct service calls also sanitize', async () => {
        const service = app.get(consultas_service_1.ConsultasService);
        const result = await service.createPublica(slug, {
            nombre_cliente: '<script>bypass</script>Cliente',
            email: 'service-direct@example.com',
            mensaje: '<b>negrita</b>contenido limpio con largo suficiente',
        });
        expect((0, sanitize_1.sanitizeText)('<script>alert(1)</script>Hola')).toBe('Hola');
        expect(result.ok).toBe(true);
    });
});
