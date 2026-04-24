import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from './cookie.config';

/**
 * Separate Passport strategy for the /auth/refresh endpoint. We extract a token
 * from the refresh_token cookie only — never from the Authorization header.
 *
 * Note: the refresh cookie holds an opaque random string, not a JWT. We still
 * register a "passport" strategy here to reuse the cookie parsing plumbing, but
 * the token is validated in the AuthService against the refresh_tokens table,
 * not by JWT verification. This strategy only ensures the cookie is present.
 */
function refreshCookieExtractor(req: Request): string | null {
  if (req.headers['authorization']) return null;
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    // The "secret" is irrelevant because refresh tokens are opaque; we override
    // validate() below to short-circuit JWT verification.
    super({
      jwtFromRequest: refreshCookieExtractor,
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_REFRESH_SECRET as string,
      passReqToCallback: true,
    });
  }

  // We don't actually use this strategy — we handle the refresh flow in the
  // controller by reading the cookie directly. Leaving it registered so if a
  // future iteration switches to JWT-based refresh, the plumbing is ready.
  async validate(req: Request) {
    return { cookiePresent: !!req.cookies?.[REFRESH_TOKEN_COOKIE] };
  }
}
