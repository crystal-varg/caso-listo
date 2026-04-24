import { detectAllowedFileType } from './file-magic';

describe('detectAllowedFileType', () => {
  it('detects PDF by %PDF- signature', () => {
    const buf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(8)]);
    expect(detectAllowedFileType(buf)).toEqual({ mime: 'application/pdf', ext: 'pdf' });
  });

  it('detects JPEG by FF D8 FF', () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(12)]);
    expect(detectAllowedFileType(buf)).toEqual({ mime: 'image/jpeg', ext: 'jpg' });
  });

  it('detects PNG by 89 50 4E 47 0D 0A 1A 0A', () => {
    const buf = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(8),
    ]);
    expect(detectAllowedFileType(buf)).toEqual({ mime: 'image/png', ext: 'png' });
  });

  it('rejects .exe (MZ signature)', () => {
    const buf = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(14)]);
    expect(detectAllowedFileType(buf)).toBeNull();
  });

  it('rejects HTML payloads masquerading as PDF', () => {
    const buf = Buffer.concat([Buffer.from('<html><body>evil</body>'), Buffer.alloc(16)]);
    expect(detectAllowedFileType(buf)).toBeNull();
  });

  it('rejects empty / too-short buffers', () => {
    expect(detectAllowedFileType(Buffer.alloc(0))).toBeNull();
    expect(detectAllowedFileType(Buffer.alloc(4))).toBeNull();
  });
});
