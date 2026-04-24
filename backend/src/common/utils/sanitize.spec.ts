import { sanitizeText, sanitizeFields } from './sanitize';

describe('sanitizeText', () => {
  it("strips <script> tags and keeps non-HTML text content", () => {
    expect(sanitizeText('<script>alert(1)</script>Hola')).toBe('Hola');
  });

  it('strips event handlers from injected tags', () => {
    const out = sanitizeText('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<img');
  });

  it("strips 'javascript:' protocol from bare text", () => {
    expect(sanitizeText('javascript:alert(1)')).not.toContain('javascript:');
    expect(sanitizeText('  JAVASCRIPT : alert(1)')).not.toMatch(/javascript\s*:/i);
  });

  it("strips 'vbscript:' protocol", () => {
    expect(sanitizeText('vbscript:msgbox(1)')).not.toContain('vbscript:');
  });

  it('leaves plain text untouched', () => {
    expect(sanitizeText('Consulta sobre divorcio')).toBe('Consulta sobre divorcio');
  });

  it('handles null and undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('coerces non-strings to strings', () => {
    expect(sanitizeText(123)).toBe('123');
    expect(sanitizeText(true)).toBe('true');
  });
});

describe('sanitizeFields', () => {
  it('only mutates the listed fields', () => {
    const input = {
      nombre_cliente: '<script>alert(1)</script>Juan',
      mensaje: '<img src=x onerror=alert(1)>',
      estado: 'nuevo', // not in fields list — must not be touched
    };
    const out = sanitizeFields(input, ['nombre_cliente', 'mensaje']);
    expect(out.nombre_cliente).toBe('Juan');
    expect(out.mensaje).not.toContain('onerror');
    expect(out.estado).toBe('nuevo');
  });

  it('ignores missing fields', () => {
    const out = sanitizeFields({ a: 'x' } as any, ['b' as any]);
    expect(out).toEqual({ a: 'x' });
  });
});
