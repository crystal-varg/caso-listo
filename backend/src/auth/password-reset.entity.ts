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
 * Password reset tokens.
 *
 * We persist only the SHA-256 hash of the token — the raw value never hits the
 * database, so a DB dump does not yield a usable reset link. Each row is
 * single-use (`used: true` flips on consumption) and has a hard expiry of one
 * hour from creation.
 */
@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  usuario_id: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  /** SHA-256 hex digest (64 chars). */
  @Index('idx_password_reset_token', { unique: true })
  @Column({ length: 64 })
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  created_at: Date;
}
