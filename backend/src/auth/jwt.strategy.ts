import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from './cookie.config';

/**
 * Extract the JWT from two sources, in priority order:
 *   1. httpOnly `access_token` cookie  — primary mechanism for the web frontend.
 *   2. `Authorization: Bearer <jwt>`    — fallback for clients that can't use
 *      cookies (the React Native mobile app reads the token from /auth/login's
 *      body and stores it in AsyncStorage).
 *
 * Cookie wins when both are present: an XSS that tries to "smuggle" a stale
 * token via Bearer can't downgrade an authenticated cookie session. The
 * original cookie-only enforcement was put in place during the localStorage →
 * cookie migration and is now relaxed because mobile genuinely needs Bearer.
 */
function tokenExtractor(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice('Bearer '.length).trim();
    if (bearer.length > 0) return bearer;
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    // JWT_SECRET is validated at startup in env.validation.ts — safe to use directly here.
    super({
      jwtFromRequest: tokenExtractor,
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
