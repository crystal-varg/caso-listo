import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from './cookie.config';

/**
 * Extract JWT from the httpOnly access_token cookie ONLY.
 *
 * If the request includes an `Authorization` header we deliberately return null
 * to force a 401. This closes a token-smuggling path during the migration from
 * localStorage to cookie storage — a malicious script with stale tokens cannot
 * fall back to Bearer auth.
 */
function cookieExtractor(req: Request): string | null {
  if (req.headers['authorization']) return null;
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    // JWT_SECRET is validated at startup in env.validation.ts — safe to use directly here.
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: { sub: number; email: string; role?: 'admin' | 'estudio' }) {
    // Tokens issued before the role rollout will not carry `role`. Default to
    // 'estudio' so AdminGuard never grants admin access on a legacy token.
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role === 'admin' ? 'admin' : 'estudio',
    };
  }
}
