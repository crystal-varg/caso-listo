import { generateSlug, isValidSlugFormat, matchesSlugFormat, SLUG_BLOCKLIST, SLUG_REGEX } from '../common/utils/slug';

describe('slug generator', () => {
  it('always produces output matching SLUG_REGEX', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug('Mi Estudio');
      expect(slug).toMatch(SLUG_REGEX);
    }
  });

  it('always contains a 16-hex-char cryptographic suffix', () => {
    const slug = generateSlug('Mi Estudio');
    const parts = slug.split('-');
    const suffix = parts[parts.length - 1];
    expect(suffix).toMatch(/^[a-f0-9]{16}$/);
  });

  it('never returns a blocklisted slug', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug(Array.from(SLUG_BLOCKLIST)[i % SLUG_BLOCKLIST.size]);
      expect(SLUG_BLOCKLIST.has(slug)).toBe(false);
    }
  });

  it("input 'admin' does not produce 'admin' or any blocklisted value", () => {
    const slug = generateSlug('admin');
    expect(slug).not.toBe('admin');
    expect(SLUG_BLOCKLIST.has(slug)).toBe(false);
    expect(slug).toMatch(SLUG_REGEX);
  });

  it("input 'root' does not produce 'root'", () => {
    const slug = generateSlug('root');
    expect(slug).not.toBe('root');
    expect(SLUG_BLOCKLIST.has(slug)).toBe(false);
  });

  it('sanitizes malicious input — no angle brackets or script fragments', () => {
    const slug = generateSlug('<script>alert("xss")</script>');
    expect(slug).not.toMatch(/[<>"\'/]/);
    expect(slug.toLowerCase()).not.toContain('script');
    expect(slug).toMatch(SLUG_REGEX);
  });

  it('produces 1000 unique values on 1000 consecutive calls (entropy test)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateSlug('test'));
    }
    expect(seen.size).toBe(1000);
  });

  it('handles empty / invalid input by falling back to neutral base', () => {
    expect(generateSlug('')).toMatch(SLUG_REGEX);
    expect(generateSlug('   ')).toMatch(SLUG_REGEX);
    expect(generateSlug('!!!')).toMatch(SLUG_REGEX);
  });

  describe('isValidSlugFormat', () => {
    it('accepts well-formed slugs', () => {
      expect(isValidSlugFormat('estudio-1234567890abcdef')).toBe(true);
    });
    it('rejects blocklisted values', () => {
      expect(isValidSlugFormat('admin')).toBe(false);
      expect(isValidSlugFormat('api')).toBe(false);
    });
    it('rejects malformed slugs', () => {
      expect(isValidSlugFormat('../etc')).toBe(false);
      expect(isValidSlugFormat('UPPER')).toBe(false);
      expect(isValidSlugFormat('ab')).toBe(false); // too short
      expect(isValidSlugFormat('-leading')).toBe(false);
      expect(isValidSlugFormat('trailing-')).toBe(false);
    });
    it('rejects non-strings', () => {
      expect(isValidSlugFormat(null)).toBe(false);
      expect(isValidSlugFormat(undefined)).toBe(false);
      expect(isValidSlugFormat(123)).toBe(false);
      expect(isValidSlugFormat({})).toBe(false);
    });
  });

  describe('matchesSlugFormat', () => {
    it('accepts format-valid slugs even if blocklisted', () => {
      // matchesSlugFormat does not enforce the blocklist — that's isValidSlugFormat's job.
      expect(matchesSlugFormat('estudio-1234567890abcdef')).toBe(true);
    });
    it('rejects path traversal attempts', () => {
      expect(matchesSlugFormat('../etc')).toBe(false);
      expect(matchesSlugFormat('..%2Fetc')).toBe(false);
      expect(matchesSlugFormat('etc/passwd')).toBe(false);
    });
  });
});
