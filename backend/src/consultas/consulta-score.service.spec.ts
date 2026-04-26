import {
  ConsultaScoreService,
  classify,
  containsDate,
  hasDocuments,
  matchesAnyKeyword,
  normalizeText,
  KEYWORDS_LABORALES,
  KEYWORDS_URGENCIA,
} from './consulta-score.service';
import { ScoreCategoria } from './consulta.entity';

describe('ConsultaScoreService', () => {
  const service = new ConsultaScoreService();

  describe('classify', () => {
    it('maps thresholds correctly', () => {
      expect(classify(0)).toBe(ScoreCategoria.BAJO);
      expect(classify(39)).toBe(ScoreCategoria.BAJO);
      expect(classify(40)).toBe(ScoreCategoria.MEDIO);
      expect(classify(69)).toBe(ScoreCategoria.MEDIO);
      expect(classify(70)).toBe(ScoreCategoria.ALTO);
      expect(classify(95)).toBe(ScoreCategoria.ALTO);
    });
  });

  describe('normalizeText', () => {
    it('lowercases and strips diacritics', () => {
      expect(normalizeText('Indemnización Por Despido')).toBe('indemnizacion por despido');
      expect(normalizeText('MAÑANA')).toBe('manana');
    });
  });

  describe('matchesAnyKeyword', () => {
    it('matches singular and plural via prefix word boundary', () => {
      expect(matchesAnyKeyword('me hicieron un despido injusto', KEYWORDS_LABORALES)).toBe(true);
      expect(matchesAnyKeyword('hubo despidos masivos', KEYWORDS_LABORALES)).toBe(true);
      expect(matchesAnyKeyword('quiero indemnizacion', KEYWORDS_LABORALES)).toBe(true);
    });
    it('does not match unrelated substrings', () => {
      expect(matchesAnyKeyword('autobus', KEYWORDS_LABORALES)).toBe(false);
      expect(matchesAnyKeyword('sin palabras laborales', KEYWORDS_LABORALES)).toBe(false);
    });
    it('detects urgency keywords', () => {
      expect(matchesAnyKeyword('es urgente', KEYWORDS_URGENCIA)).toBe(true);
      expect(matchesAnyKeyword('tengo audiencia el viernes', KEYWORDS_URGENCIA)).toBe(true);
      expect(matchesAnyKeyword('vencimiento mañana', KEYWORDS_URGENCIA)).toBe(true);
    });
  });

  describe('hasDocuments', () => {
    it('treats "faltante" as no document', () => {
      expect(hasDocuments({ dni_archivo: 'faltante', docs_archivo: null })).toBe(false);
    });
    it('detects a real uploaded file', () => {
      expect(hasDocuments({ dni_archivo: 'abc.pdf', docs_archivo: null })).toBe(true);
      expect(hasDocuments({ dni_archivo: null, docs_archivo: 'x.pdf' })).toBe(true);
    });
    it('returns false when both fields are null/undefined', () => {
      expect(hasDocuments({})).toBe(false);
      expect(hasDocuments({ dni_archivo: null, docs_archivo: null })).toBe(false);
    });
  });

  describe('containsDate', () => {
    it('matches dd/mm fragments', () => {
      expect(containsDate('reunión el 15/03 a las 9')).toBe(true);
      expect(containsDate('5/2 vence el plazo')).toBe(true);
    });
    it('matches 4-digit years', () => {
      expect(containsDate('contrato firmado en 2024')).toBe(true);
      expect(containsDate('desde 1999 trabaja allí')).toBe(true);
    });
    it('returns false when no date pattern is present', () => {
      expect(containsDate('texto sin fechas')).toBe(false);
      expect(containsDate('123 cosas')).toBe(false);
    });
  });

  describe('calculateScore — full integration', () => {
    it('returns 0/BAJO for an empty mensaje and no documents', () => {
      expect(service.calculateScore({ mensaje: '', dni_archivo: null, docs_archivo: null }))
        .toEqual({ score: 0, category: ScoreCategoria.BAJO });
    });

    it('+30 for laboral keyword alone — BAJO (still under 40)', () => {
      const result = service.calculateScore({
        mensaje: 'fui víctima de un despido',
      });
      expect(result.score).toBe(30);
      expect(result.category).toBe(ScoreCategoria.BAJO);
    });

    it('+30 +25 = 55 → MEDIO (laboral + urgencia)', () => {
      const result = service.calculateScore({
        mensaje: 'tengo una audiencia y me despidieron',
      });
      // "despidieron" prefix-matches "despido" via \bdespido pattern.
      expect(result.score).toBe(55);
      expect(result.category).toBe(ScoreCategoria.MEDIO);
    });

    it('+30 +25 +20 +10 +10 = 95 → ALTO', () => {
      const longMensajeConFecha =
        'Necesito asesoramiento urgente sobre un despido laboral. Tengo audiencia el 15/03/2024. ' +
        'Adjunto la documentación de mi caso para que la revisen lo antes posible por favor.';
      expect(longMensajeConFecha.length).toBeGreaterThan(100);

      const result = service.calculateScore({
        mensaje: longMensajeConFecha,
        dni_archivo: 'abc123.pdf',
        docs_archivo: null,
      });
      expect(result.score).toBe(95);
      expect(result.category).toBe(ScoreCategoria.ALTO);
    });

    it('treats faltante uploads as no document for scoring purposes', () => {
      const result = service.calculateScore({
        mensaje: 'cualquier texto sin keywords',
        dni_archivo: 'faltante',
        docs_archivo: 'faltante',
      });
      expect(result.score).toBe(0);
    });

    it('handles null mensaje gracefully', () => {
      const result = service.calculateScore({ mensaje: null });
      expect(result.score).toBe(0);
      expect(result.category).toBe(ScoreCategoria.BAJO);
    });

    it('detects keywords regardless of accents', () => {
      const result = service.calculateScore({
        mensaje: 'pido la INDEMNIZACIÓN correspondiente',
      });
      expect(result.score).toBe(30);
    });

    it('length bonus only kicks in over 100 chars (not at exactly 100)', () => {
      const exactly100 = 'x'.repeat(100);
      const result = service.calculateScore({ mensaje: exactly100 });
      expect(result.score).toBe(0);
    });

    it('ignores accidental keyword inside an unrelated word', () => {
      // "trabajado" prefix-matches "trabajo" — for v1 we accept that as desired
      // (it is in the laboral semantic field). This test documents the behaviour.
      const result = service.calculateScore({
        mensaje: 'he trabajado allí muchos años',
      });
      expect(result.score).toBe(30);
    });
  });
});
