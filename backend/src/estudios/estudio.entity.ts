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
   */
  @Index('idx_estudio_slug', { unique: true })
  @Column({ length: 80, unique: true })
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
