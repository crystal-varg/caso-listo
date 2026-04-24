import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../users/usuario.entity';

/**
 * Refresh token store. We persist only the SHA-256 hash of the token — the raw
 * secret never hits the database, so a DB dump does not yield a usable token.
 *
 * `replaced_by_id` creates a rotation chain so post-incident we can detect
 * token-reuse attacks (attacker replays an old refresh after a legit rotation).
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_refresh_token_hash', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  token_hash: string;

  @Index('idx_refresh_usuario_id')
  @Column()
  usuario_id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'int', nullable: true })
  replaced_by_id: number | null;

  @CreateDateColumn()
  created_at: Date;
}
