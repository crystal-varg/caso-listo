import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { PasswordReset } from './password-reset.entity';

/** Token TTL: 1 hour. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordReset)
    private repo: Repository<PasswordReset>,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Issue a new password reset token. Any previously unused tokens for the
   * same user are invalidated, so only the most recent request is live.
   * Returns the raw token — caller must email it and never store it.
   */
  async issue(usuarioId: number): Promise<{ raw: string }> {
    await this.repo
      .createQueryBuilder()
      .update(PasswordReset)
      .set({ used: true })
      .where('usuario_id = :uid AND used = false', { uid: usuarioId })
      .execute();

    const raw = randomBytes(32).toString('hex'); // 256 bits of entropy
    const record = this.repo.create({
      usuario_id: usuarioId,
      token: this.hash(raw),
      expires_at: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      used: false,
    });
    await this.repo.save(record);
    return { raw };
  }

  /**
   * Validate, mark as used, and return the owning usuario_id. Returns `null`
   * for any failure mode (unknown token, already used, expired) — callers
   * surface the same generic error message regardless to avoid leaking which
   * specific check failed.
   */
  async consume(raw: string): Promise<number | null> {
    if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/.test(raw)) return null;

    const hash = this.hash(raw);
    const record = await this.repo.findOne({ where: { token: hash } });
    if (!record) return null;
    if (record.used) return null;
    if (record.expires_at.getTime() < Date.now()) return null;

    record.used = true;
    await this.repo.save(record);
    return record.usuario_id;
  }
}
