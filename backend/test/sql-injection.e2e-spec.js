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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const test_helpers_1 = require("./test-helpers");
describe('SQL injection defence (e2e)', () => {
    let app;
    let access = '';
    beforeAll(async () => {
        app = await (0, test_helpers_1.bootTestApp)();
        const res = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
            nombre: 'SQL Test',
            email: (0, test_helpers_1.randomEmail)(),
            password: 'Password1',
            nombre_estudio: 'SQL Estudio',
        });
        access = (0, test_helpers_1.extractCookie)(res.headers['set-cookie'], 'access_token') ?? '';
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
        const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'consultas', 'consultas.service.ts'), 'utf-8');
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
