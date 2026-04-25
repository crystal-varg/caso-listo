import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { validateEnv } from './config/env.validation';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Fail fast on bad configuration — before Nest tries to start any module.
  const env = validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // We handle error serialization through AllExceptionsFilter, so leave
    // nest's default logger enabled but ready to be narrowed in production.
    logger: env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['debug', 'log', 'error', 'warn'],
  });

  // Trust only proxies we explicitly list. Railway fronts the app with its
  // own load balancer — the first hop is trusted, nothing beyond it is.
  if (env.TRUSTED_PROXIES.length > 0) {
    app.set('trust proxy', env.TRUSTED_PROXIES);
  } else {
    // When no explicit proxies are configured, trust exactly 1 hop.
    // This prevents arbitrary X-Forwarded-For values from untrusted clients.
    app.set('trust proxy', 1);
  }

  // ── Cookies ────────────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── Explicit OPTIONS preflight handler ────────────────────────────────────
  // Must be registered before helmet so preflight requests get CORS headers.
  // The actual access-control gate for data-bearing methods (GET/POST/PATCH/
  // DELETE) is enableCors() below — it enforces the ALLOWED_ORIGINS allowlist.
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin ?? '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,Origin,X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '600');
      return res.sendStatus(204);
    }
    next();
  });

  // ── CORS (must register BEFORE helmet) ────────────────────────────────────
  // Helmet otherwise responds to OPTIONS preflights without
  // Access-Control-Allow-Origin, blocking the browser before CORS can answer.
  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin / Postman / server-to-server (no Origin header).
      if (!origin) return callback(null, true);
      if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // Do not echo the origin back — simply reject.
      callback(new Error(`Origen no permitido: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
    maxAge: 600,
  });

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(
    helmet({
      // Strict CSP for a REST API — no inline scripts, no eval, no remote origins.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // file-serving endpoint compatibility
      // Frontend (casolisto.online via Vercel) and backend (Railway) live on
      // different registrable domains, so 'same-site' would block CORS
      // preflights before our CORS middleware ever runs. The CORS allowlist in
      // enableCors() is the actual access-control gate; CORP only governs how
      // browsers may embed our responses cross-origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        includeSubDomains: true,
        preload: false,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // ── Global validation ──────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ── Response serialization — strips @Exclude()-marked fields (e.g., password) ─
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ── Global exception filter — homogeneous error shape, no stack leakage ───
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  await app.listen(env.PORT, '0.0.0.0'); // 0.0.0.0 required for Railway
  // eslint-disable-next-line no-console
  console.log(`🚀 CasoListo Backend en puerto ${env.PORT} (${env.NODE_ENV})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
