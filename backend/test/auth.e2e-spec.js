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
describe('Auth (e2e)', () => {
    let app;
    const email = (0, test_helpers_1.randomEmail)();
    const password = 'TestPassword1';
    let accessCookie = '';
    let refreshCookie = '';
    beforeAll(async () => {
        app = await (0, test_helpers_1.bootTestApp)();
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
        const setCookie = res.headers['set-cookie'];
        expect((0, test_helpers_1.extractCookie)(setCookie, 'access_token')).toBeDefined();
        expect((0, test_helpers_1.extractCookie)(setCookie, 'refresh_token')).toBeDefined();
        const accessRaw = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((c) => c.startsWith('access_token='));
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
        const setCookie = res.headers['set-cookie'];
        accessCookie = (0, test_helpers_1.extractCookie)(setCookie, 'access_token') ?? '';
        refreshCookie = (0, test_helpers_1.extractCookie)(setCookie, 'refresh_token') ?? '';
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
        const setCookie = res.headers['set-cookie'];
        const newRefresh = (0, test_helpers_1.extractCookie)(setCookie, 'refresh_token');
        expect(newRefresh).toBeDefined();
        expect(newRefresh).not.toEqual(refreshCookie);
        await request(app.getHttpServer())
            .post('/api/auth/refresh')
            .set('Cookie', `refresh_token=${refreshCookie}`)
            .expect(401);
        refreshCookie = newRefresh;
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
        const setCookie = res.headers['set-cookie'];
        expect(setCookie.join(' ')).toContain('access_token=');
        expect(setCookie.join(' ')).toContain('refresh_token=');
    });
});
describe('Auth — password hash exposure', () => {
    let app;
    beforeAll(async () => { app = await (0, test_helpers_1.bootTestApp)(); });
    afterAll(async () => { await app.close(); });
    it('none of the auth endpoints serialize a `password` field at any depth', async () => {
        const email = (0, test_helpers_1.randomEmail)();
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
        const access = (0, test_helpers_1.extractCookie)(login.headers['set-cookie'], 'access_token') ?? '';
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
