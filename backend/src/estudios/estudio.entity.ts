import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Usuario } from '../users/usuario.entity';
import { Consulta } from '../consultas/consulta.entity';

@Entity('estudios')
export class Estudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre_estudio: string;

  /**
   * Public URL slug. Unique, indexed — DB-level enforcement prevents
   * race-condition collisions during slug generation retries.
   *
   * `nullable: true` is required because legacy rows in production predate
   * the slug-generation hardening and may carry NULL slugs; flipping to NOT
   * NULL would crash TypeORM `synchronize`. PostgreSQL treats NULL values as
   * distinct in a unique index, so the unique constraint still prevents
   * duplicate non-null slugs.
   */
  @Index('idx_estudio_slug', { unique: true })
  @Column({ length: 80, unique: true, nullable: true })
  slug: string;

  @OneToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column()
  usuario_id: number;

  @OneToMany(() => Consulta, (consulta) => consulta.estudio)
  consultas: Consulta[];

  @CreateDateColumn()
  created_at: Date;
}
