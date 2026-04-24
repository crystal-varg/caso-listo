/**
 * Environment validation — executed synchronously before NestJS bootstrap.
 * Fails fast on missing or insecure configuration in production.
 */

const INSECURE_SECRETS = new Set([
  'caso-listo-secret-dev',
  'secret',
  'changeme',
  'default',
  'dev',
  'development',
  'production',
  'password',
  '123456',
]);

const MIN_SECRET_LENGTH = 32;

export interface ValidatedEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  DATABASE_URL?: string;
  ALLOWED_ORIGINS: string[];
  COOKIE_DOMAIN?: string;
  PORT: number;
  TRUSTED_PROXIES: string[];
  SMTP_USER?: string;
  SMTP_PASS?: string;
  FRONTEND_URL?: string;
}

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(`\n❌ Environment validation failed: ${message}\n`);
  process.exit(1);
}

function warn(message: string): void {
  // eslint-disable-next-line no-console
  console.warn(`⚠️  ${message}`);
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    fail(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function validateSecret(key: string, value: string): void {
  if (value.length < MIN_SECRET_LENGTH) {
    fail(
      `${key} must be at least ${MIN_SECRET_LENGTH} characters long (got ${value.length})`,
    );
  }
  if (INSECURE_SECRETS.has(value.toLowerCase())) {
    fail(`${key} is a known insecure default. Replace it immediately.`);
  }
}

export function validateEnv(): ValidatedEnv {
  const nodeEnv = (process.env.NODE_ENV ?? 'development').trim() as ValidatedEnv['NODE_ENV'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    fail(`NODE_ENV must be one of: development | production | test (got: ${nodeEnv})`);
  }

  const jwtSecret = requireEnv('JWT_SECRET');
  validateSecret('JWT_SECRET', jwtSecret);

  const jwtRefreshSecret = requireEnv('JWT_REFRESH_SECRET');
  validateSecret('JWT_REFRESH_SECRET', jwtRefreshSecret);

  if (jwtSecret === jwtRefreshSecret) {
    fail('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }

  // DATABASE_URL or DB_* fallback is handled in app.module.ts. In production, DATABASE_URL is required.
  if (nodeEnv === 'production' && !process.env.DATABASE_URL) {
    fail('DATABASE_URL is required in production.');
  }

  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS;
  if (!allowedOriginsRaw && nodeEnv === 'production') {
    fail('ALLOWED_ORIGINS is required in production (comma-separated list of full origins).');
  }
  const allowedOrigins =
    (allowedOriginsRaw ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

  // Validate origin format
  for (const origin of allowedOrigins) {
    try {
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol)) {
        fail(`Invalid origin protocol in ALLOWED_ORIGINS: ${origin}`);
      }
    } catch {
      fail(`Malformed origin in ALLOWED_ORIGINS: ${origin}`);
    }
  }

  const port = parseInt(process.env.PORT ?? '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    fail(`PORT must be a valid port number (got: ${process.env.PORT})`);
  }

  const trustedProxies = (process.env.TRUSTED_PROXIES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  // Email is optional — warn but do not fail
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    warn('SMTP_USER / SMTP_PASS are not set — email notifications will be silently skipped.');
  }

  return {
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    DATABASE_URL: process.env.DATABASE_URL,
    ALLOWED_ORIGINS: allowedOrigins,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    PORT: port,
    TRUSTED_PROXIES: trustedProxies,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };
}
