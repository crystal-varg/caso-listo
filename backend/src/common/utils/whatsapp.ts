import { BadRequestException } from '@nestjs/common';

/**
 * WhatsApp links are rendered as clickable anchors in the UI. Any untrusted URL
 * reaching that renderer is a potential phishing/XSS vector, so validation lives
 * on the backend — not the DTO (which could be bypassed by internal callers),
 * not the frontend (which is zero-trust).
 */
const WA_LINK_REGEX = /^https:\/\/wa\.me\/\+?[0-9]{7,15}(\?.*)?$/;

/** Returns `true` if the link is a well-formed wa.me URL. */
export function isValidWaLink(link: unknown): link is string {
  return typeof link === 'string' && WA_LINK_REGEX.test(link);
}

/**
 * Returns the validated link or throws `BadRequestException`. Use in service
 * methods that accept a WhatsApp link from an external caller (DTO input, etc.).
 */
export function assertWaLink(link: string): string {
  if (!isValidWaLink(link)) {
    throw new BadRequestException('wa_link inválido.');
  }
  return link;
}

/**
 * Sanitize a WhatsApp link produced internally (e.g., from a lawyer's phone
 * number). Returns the link if valid, `null` otherwise — never throws, so
 * notification creation is not blocked by a malformed phone number on record.
 */
export function safeWaLink(link: string | null | undefined): string | null {
  if (!link) return null;
  return isValidWaLink(link) ? link : null;
}

/** Build a wa.me URL from a phone number. Returns null if the phone is unusable. */
export function buildWaLink(telefono: string | null | undefined, mensaje: string): string | null {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
  return isValidWaLink(url) ? url : null;
}
