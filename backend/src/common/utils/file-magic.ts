/**
 * Magic-byte MIME detection for the exact set of formats CasoListo accepts:
 * PDF, JPEG, PNG. We do NOT trust the Content-Type header (client-controlled)
 * or the file extension (client-controlled) — only the actual byte signature.
 *
 * Implemented inline to avoid depending on `file-type` (ESM-only since v17),
 * which would require dynamic import gymnastics under our CJS TS config.
 */

export type AllowedMime = 'application/pdf' | 'image/jpeg' | 'image/png';

const SIGNATURES: Array<{ mime: AllowedMime; bytes: number[][]; offset?: number; ext: string }> = [
  // PDF: "%PDF-" at offset 0. Some PDFs begin with a UTF-8 BOM, so also check offset 3.
  { mime: 'application/pdf', ext: 'pdf', bytes: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
  { mime: 'application/pdf', ext: 'pdf', offset: 3, bytes: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', ext: 'jpg', bytes: [[0xff, 0xd8, 0xff]] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', ext: 'png', bytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
];

export interface FileTypeInfo {
  mime: AllowedMime;
  ext: string;
}

/**
 * Returns the detected MIME type or null if the bytes don't match any allowed format.
 * Reads only the first 16 bytes — sufficient for all three formats.
 */
export function detectAllowedFileType(buffer: Buffer): FileTypeInfo | null {
  if (!buffer || buffer.length < 8) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    for (const pattern of sig.bytes) {
      if (buffer.length < offset + pattern.length) continue;
      let match = true;
      for (let i = 0; i < pattern.length; i++) {
        if (buffer[offset + i] !== pattern[i]) {
          match = false;
          break;
        }
      }
      if (match) return { mime: sig.mime, ext: sig.ext };
    }
  }
  return null;
}

export const ALLOWED_MIME_TYPES: readonly AllowedMime[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];
