import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { RefreshToken } from './refresh-token.entity';

export interface IssuedRefresh {
  id: number;
  raw: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private repo: Repository<RefreshToken>,
  ) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** Issue a new refresh token and persist its hash. Returns the raw value to cookie-set. */
  async issue(usuarioId: number, ttlMs: number): Promise<IssuedRefresh> {
    const raw = randomBytes(48).toString('hex'); // 384 bits of entropy
    const record = this.repo.create({
      token_hash: this.hash(raw),
      usuario_id: usuarioId,
      expires_at: new Date(Date.now() + ttlMs),
      revoked_at: null,
      replaced_by_id: null,
    });
    const saved = await this.repo.save(record);
    return { id: saved.id, raw };
  }

  /**
   * Rotate a refresh token atomically: verify the raw token is live, revoke it,
   * issue a new one linked by `replaced_by_id`. Detects reuse of already-revoked
   * tokens — in that case we revoke the entire chain (assumed compromised) and
   * throw 401.
   */
  async rotate(raw: string, ttlMs: number): Promise<{ usuarioId: number; issued: IssuedRefresh }> {
    const hash = this.hash(raw);
    const existing = await this.repo.findOne({ where: { token_hash: hash } });

    if (!existing) {
      throw new UnauthorizedException('Token inválido.');
    }

    if (existing.revoked_at !== null) {
      // Token reuse detected — the chain is compromised. Revoke all outstanding
      // tokens for this user so an attacker holding a stolen refresh can't pivot.
      this.logger.warn(`Refresh token reuse detected for user ${existing.usuario_id}; revoking all tokens.`);
      await this.revokeAllForUser(existing.usuario_id);
      throw new UnauthorizedException('Token inválido.');
    }

    if (existing.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Token expirado.');
    }

    // Issue the replacement first so we can link it.
    const replacement = await this.issue(existing.usuario_id, ttlMs);

    existing.revoked_at = new Date();
    existing.replaced_by_id = replacement.id;
    await this.repo.save(existing);

    return { usuarioId: existing.usuario_id, issued: replacement };
  }

  /** Revoke a specific token (e.g., on logout). Safe to call with an unknown token. */
  async revoke(raw: string): Promise<void> {
    const hash = this.hash(raw);
    await this.repo.update({ token_hash: hash, revoked_at: null as any }, { revoked_at: new Date() });
  }

  /** Revoke every live token for a user (used on reuse detection and full logout). */
  async revokeAllForUser(usuarioId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where('usuario_id = :uid AND revoked_at IS NULL', { uid: usuarioId })
      .execute();
  }

  /** Clean up expired tokens. Call periodically — e.g., from a cron job. */
  async purgeExpired(): Promise<number> {
    const result = await this.repo.delete({ expires_at: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
