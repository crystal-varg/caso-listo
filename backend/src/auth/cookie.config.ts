import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Access token lifetime — 15 minutes. */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Refresh token lifetime — 7 days. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Access token JWT `expiresIn` — matches the cookie Max-Age. */
export const ACCESS_TOKEN_JWT_EXPIRES = '15m';

function baseCookie(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    // sameSite: 'none' + secure: true is the only combination that lets the
    // browser send the cookie on cross-origin requests (frontend on
    // casolisto.online → backend on caso-listo-production.up.railway.app).
    // 'none' requires 'secure', so we set both unconditionally. Modern browsers
    // exempt localhost from the HTTPS requirement, so local dev still works.
    sameSite: 'none',
    secure: true,
    maxAge: maxAgeMs,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

export function accessCookieOptions(): CookieOptions {
  return baseCookie(ACCESS_TOKEN_TTL_MS);
}

export function refreshCookieOptions(): CookieOptions {
  const opts = baseCookie(REFRESH_TOKEN_TTL_MS);
  // The refresh cookie is only sent to /auth/refresh and /auth/logout, reducing
  // exposure surface. Browsers submit it only when the request path matches.
  opts.path = '/api/auth';
  return opts;
}

/** Cookie options used when *clearing* a cookie (must match set-time path/domain). */
export function clearAccessCookieOptions(): CookieOptions {
  const opts = accessCookieOptions();
  opts.maxAge = 0;
  return opts;
}

export function clearRefreshCookieOptions(): CookieOptions {
  const opts = refreshCookieOptions();
  opts.maxAge = 0;
  return opts;
}
