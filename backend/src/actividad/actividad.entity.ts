import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Consulta } from '../consultas/consulta.entity';

@Entity('actividad')
export class Actividad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  consulta_id: number;

  @ManyToOne(() => Consulta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta;

  // consulta_creada | estado_cambiado | documento_subido | evento_creado | nota_creada | honorario_creado | cobro_registrado
  // nullable: true defends against legacy rows; ActividadService.registrar
  // always sets this from a closed-set string literal, so new rows remain non-null.
  @Column({ nullable: true })
  tipo: string;

  @Column({ nullable: true, type: 'text' })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;
}
