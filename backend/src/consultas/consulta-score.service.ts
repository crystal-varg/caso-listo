import { Injectable } from '@nestjs/common';
import { ScoreCategoria } from './consulta.entity';

/**
 * Pure scoring engine for incoming consultations.
 *
 * Designed as a stateless service so it can be unit-tested without spinning
 * up a Nest test bed and so the scoring rules can be tuned in one place.
 *
 * Rules (v1, kept simple on purpose — easy to extend):
 *   +30  if mensaje matches any "laboral" keyword
 *   +25  if mensaje matches any "urgencia" keyword
 *   +20  if at least one document was actually uploaded
 *   +10  if mensaje length > 100 chars
 *   +10  if mensaje contains a date-like fragment
 *
 * Classification:
 *   score >= 70  → ALTO
 *   score >= 40  → MEDIO
 *   score <  40  → BAJO
 */

export interface ScoreResult {
  score: number;
  category: ScoreCategoria;
}

/**
 * Minimal interface so the engine can also score plain DTOs (not just entity
 * instances), making unit tests trivial to write.
 */
export interface ScorableConsulta {
  mensaje?: string | null;
  dni_archivo?: string | null;
  docs_archivo?: string | null;
}

// ── Keyword sets — already normalized (lowercase + no diacritics). ──────────
export const KEYWORDS_LABORALES: readonly string[] = [
  'despido',
  'indemnizacion',
  'trabajo',
  'empleador',
];

export const KEYWORDS_URGENCIA: readonly string[] = [
  'urgente',
  'hoy',
  'manana',
  'audiencia',
  'vencimiento',
];

// ── Score weights ────────────────────────────────────────────────────────────
export const PUNTOS_LABORAL = 30;
export const PUNTOS_URGENCIA = 25;
export const PUNTOS_DOCUMENTOS = 20;
export const PUNTOS_LONGITUD = 10;
export const PUNTOS_FECHA = 10;

export const MIN_LONGITUD_BONUS = 100;
export const UMBRAL_ALTO = 70;
export const UMBRAL_MEDIO = 40;

// ── Pure helpers (exported for unit tests) ───────────────────────────────────

/** Lowercase + strip combining diacritics so "indemnización" → "indemnizacion". */
export function normalizeText(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a keyword as a "starts-with-word-boundary" pattern.
 * "despido" matches "despido", "despidos", "despidí" — but not "redespido"
 * or "subdespido". Good enough for v1 scoring without bringing in a stemmer.
 */
export function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => new RegExp(`\\b${escapeRegex(k)}`, 'i').test(text));
}

/** A real upload is anything other than null/undefined and the sentinel "faltante". */
function hasUploadedFile(filename: string | null | undefined): boolean {
  return !!filename && filename !== 'faltante';
}

export function hasDocuments(c: ScorableConsulta): boolean {
  return hasUploadedFile(c.dni_archivo) || hasUploadedFile(c.docs_archivo);
}

/** Match either dd/mm fragments or 4-digit years 1900-2099. */
export function containsDate(text: string): boolean {
  return /\d{1,2}\/\d{1,2}/.test(text) || /\b(19|20)\d{2}\b/.test(text);
}

export function classify(score: number): ScoreCategoria {
  if (score >= UMBRAL_ALTO) return ScoreCategoria.ALTO;
  if (score >= UMBRAL_MEDIO) return ScoreCategoria.MEDIO;
  return ScoreCategoria.BAJO;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ConsultaScoreService {
  calculateScore(c: ScorableConsulta): ScoreResult {
    const raw = c.mensaje ?? '';
    const texto = normalizeText(raw);

    let score = 0;
    if (matchesAnyKeyword(texto, KEYWORDS_LABORALES)) score += PUNTOS_LABORAL;
    if (matchesAnyKeyword(texto, KEYWORDS_URGENCIA)) score += PUNTOS_URGENCIA;
    if (hasDocuments(c)) score += PUNTOS_DOCUMENTOS;
    if (raw.length > MIN_LONGITUD_BONUS) score += PUNTOS_LONGITUD;
    if (containsDate(raw)) score += PUNTOS_FECHA;

    return { score, category: classify(score) };
  }
}
