import { randomBytes } from 'crypto';

/** Reserved slugs — public routes, admin paths, and known traps. Never allocate these. */
export const SLUG_BLOCKLIST: ReadonlySet<string> = new Set([
  'admin', 'api', 'login', 'register', 'dashboard', 'config', 'configuracion',
  'superadmin', 'root', 'sistema', 'soporte', 'billing', 'pagos', 'webhook',
  'health', 'status', 'metrics', 'static', 'assets', 'public', 'private',
  'interno', 'test', 'demo', 'dev', 'staging', 'prod', 'production',
  'null', 'undefined', 'true', 'false', 'me', 'mio', 'publica', 'archivos',
]);

/** Regex for slug format validation — must match on every public endpoint. */
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{6,78}[a-z0-9]$/;

/** Minimum and maximum total slug length. */
const MIN_BASE_LENGTH = 1;
const MAX_BASE_LENGTH = 40;

/**
 * Strip to ASCII alphanumeric + hyphens. Caller controls input safety of the
 * base string; this function never trusts the caller, it filters to a strict
 * character set.
 */
function sanitizeBase(raw: string): string {
  const normalized = (raw ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const filtered = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return filtered.slice(0, MAX_BASE_LENGTH);
}

/**
 * Generate a slug with 64 bits of cryptographic entropy.
 * Format: `{sanitized-base}-{16-hex-chars}`
 *
 * Guarantees:
 *   - Never returns a blocklisted value (neither full slug nor base token).
 *   - Uses `crypto.randomBytes` (never `Math.random`).
 *   - Always matches `SLUG_REGEX`.
 *   - Never contains angle brackets or script fragments.
 */
export function generateSlug(rawBase: string): string {
  let base = sanitizeBase(rawBase);
  if (base.length < MIN_BASE_LENGTH || SLUG_BLOCKLIST.has(base)) {
    base = 'estudio'; // neutral fallback
  }
  // The fallback itself must not be blocklisted.
  if (SLUG_BLOCKLIST.has(base)) base = 'e';

  // 8 random bytes -> 16 hex chars -> 64 bits of entropy.
  const suffix = randomBytes(8).toString('hex');
  let slug = `${base}-${suffix}`;

  // Unlikely but guarded: if the composed slug is somehow blocklisted, regenerate.
  // (base is already non-blocklisted, so collisions here are effectively impossible.)
  let attempts = 0;
  while (SLUG_BLOCKLIST.has(slug) && attempts < 10) {
    slug = `${base}-${randomBytes(8).toString('hex')}`;
    attempts++;
  }

  if (!SLUG_REGEX.test(slug)) {
    // Absolute last resort — generate a purely random slug.
    slug = `e-${randomBytes(8).toString('hex')}`;
  }

  return slug;
}

/** True if the given string is a valid slug format AND not blocklisted. */
export function isValidSlugFormat(slug: unknown): slug is string {
  if (typeof slug !== 'string') return false;
  if (!SLUG_REGEX.test(slug)) return false;
  if (SLUG_BLOCKLIST.has(slug)) return false;
  return true;
}

/** True only if the given string matches the slug regex — ignores blocklist. */
export function matchesSlugFormat(slug: unknown): slug is string {
  return typeof slug === 'string' && SLUG_REGEX.test(slug);
}
