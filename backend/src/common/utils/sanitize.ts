import DOMPurify from 'isomorphic-dompurify';

/**
 * Server-side XSS sanitization — strips ALL HTML tags and dangerous protocols.
 *
 * Our application never renders user-submitted HTML. Therefore the safe default
 * is to strip every tag and return plain text. If a future feature needs to
 * allow a controlled subset of HTML (e.g., rich text), create a separate
 * `sanitizeRichText` function with an explicit allowlist — never loosen this one.
 */
export function sanitizeText(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const clean = DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  // Belt-and-suspenders: strip javascript: / data: / vbscript: protocols that
  // survive tag stripping when they appear as bare text (URLs in textareas).
  return clean
    .replace(/\bjavascript\s*:/gi, '')
    .replace(/\bvbscript\s*:/gi, '')
    .replace(/\bdata\s*:\s*text\/html/gi, '')
    .trim();
}

/**
 * Sanitize an object in place by running `sanitizeText` on every string field
 * listed in `fields`. Does not mutate fields not listed.
 */
export function sanitizeFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const out = { ...obj };
  for (const field of fields) {
    const val = out[field];
    if (typeof val === 'string') {
      out[field] = sanitizeText(val) as T[keyof T];
    }
  }
  return out;
}
