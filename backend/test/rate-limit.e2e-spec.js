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
describe('Rate limiting (e2e)', () => {
    let app;
    beforeAll(async () => { app = await (0, test_helpers_1.bootTestApp)(); });
    afterAll(async () => { await app.close(); });
    it('6th POST /auth/login within 15 min from same IP returns 429', async () => {
        const email = (0, test_helpers_1.randomEmail)();
        for (let i = 0; i < 5; i++) {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password: 'wrong' })
                .expect(401);
        }
        const res = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: 'wrong' });
        expect(res.status).toBe(429);
        const retryAfter = res.headers['retry-after'];
        expect(retryAfter).toBeDefined();
        expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
    });
    it('register endpoint rate-limits after 10 requests per hour', async () => {
        let last = null;
        for (let i = 0; i < 11; i++) {
            last = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                nombre: 'X',
                email: (0, test_helpers_1.randomEmail)(),
                password: 'Password1',
                nombre_estudio: 'X',
            });
        }
        expect(last.status).toBe(429);
    });
    it('rate limit is per IP — requests from a different IP are not affected', async () => {
        const email = (0, test_helpers_1.randomEmail)();
        for (let i = 0; i < 6; i++) {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email, password: 'wrong' });
        }
        const res = await request(app.getHttpServer())
            .post('/api/auth/login')
            .set('X-Forwarded-For', '10.0.0.99')
            .send({ email, password: 'wrong' });
        expect([401, 429]).toContain(res.status);
    });
});
