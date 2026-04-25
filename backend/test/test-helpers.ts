import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * Boot a full NestJS application for e2e testing with the same hardening as
 * production (cookies, validation, serializer, filter). CORS/helmet are
 * skipped in the test harness — they are exercised by focused unit tests.
 */
export async function bootTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  await app.init();
  return app;
}

/** Random email for per-test user isolation. */
export function randomEmail(): string {
  return `test_${Date.now()}_${Math.floor(Math.random() * 1e9)}@example.com`;
}

/**
 * Extract a cookie value from a Set-Cookie response header.
 * Returns `undefined` if the cookie is absent.
 */
export function extractCookie(setCookie: string | string[] | undefined, name: string): string | undefined {
  if (!setCookie) return undefined;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of arr) {
    const match = c.match(new RegExp(`^${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}
