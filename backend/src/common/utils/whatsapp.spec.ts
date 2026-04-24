import { isValidWaLink, assertWaLink, safeWaLink, buildWaLink } from './whatsapp';
import { BadRequestException } from '@nestjs/common';

describe('isValidWaLink', () => {
  it('accepts canonical wa.me URLs', () => {
    expect(isValidWaLink('https://wa.me/5491123456789')).toBe(true);
    expect(isValidWaLink('https://wa.me/+5491123456789')).toBe(true);
    expect(isValidWaLink('https://wa.me/5491123456789?text=hello')).toBe(true);
  });

  it('rejects non-HTTPS', () => {
    expect(isValidWaLink('http://wa.me/5491123456789')).toBe(false);
  });

  it('rejects phishing lookalikes', () => {
    expect(isValidWaLink('https://wa.me.evil.com/123')).toBe(false);
    expect(isValidWaLink('https://evil.com/wa.me/123')).toBe(false);
    expect(isValidWaLink('https://wa.me@evil.com/123')).toBe(false);
  });

  it('rejects javascript: URLs', () => {
    expect(isValidWaLink('javascript:alert(1)')).toBe(false);
  });

  it('rejects phone numbers that are too short or too long', () => {
    expect(isValidWaLink('https://wa.me/123')).toBe(false);
    expect(isValidWaLink('https://wa.me/1234567890123456')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidWaLink(null)).toBe(false);
    expect(isValidWaLink(undefined)).toBe(false);
    expect(isValidWaLink(123)).toBe(false);
  });
});

describe('assertWaLink', () => {
  it('returns the link when valid', () => {
    expect(assertWaLink('https://wa.me/5491123456789')).toBe('https://wa.me/5491123456789');
  });
  it('throws BadRequestException when invalid', () => {
    expect(() => assertWaLink('javascript:alert(1)')).toThrow(BadRequestException);
  });
});

describe('safeWaLink', () => {
  it('returns the link when valid', () => {
    expect(safeWaLink('https://wa.me/5491123456789')).toBe('https://wa.me/5491123456789');
  });
  it('returns null instead of throwing', () => {
    expect(safeWaLink('javascript:alert(1)')).toBeNull();
    expect(safeWaLink(null)).toBeNull();
    expect(safeWaLink(undefined)).toBeNull();
    expect(safeWaLink('')).toBeNull();
  });
});

describe('buildWaLink', () => {
  it('builds a valid wa.me URL from a clean phone number', () => {
    const link = buildWaLink('+54 911 2345 6789', 'hola');
    expect(link).toMatch(/^https:\/\/wa\.me\/\+?[0-9]{7,15}\?text=hola$/);
  });
  it('returns null when the phone has too few digits', () => {
    expect(buildWaLink('123', 'hi')).toBeNull();
  });
  it('returns null for null / undefined', () => {
    expect(buildWaLink(null, 'hi')).toBeNull();
    expect(buildWaLink(undefined, 'hi')).toBeNull();
  });
});
