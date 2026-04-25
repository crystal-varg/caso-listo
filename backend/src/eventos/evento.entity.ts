import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Consulta } from '../consultas/consulta.entity';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  consulta_id: number;

  @ManyToOne(() => Consulta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta;

  // nullable: true defends against legacy rows; EventosService always sets
  // titulo and fecha via DTO validation, so new rows remain non-null.
  @Column({ nullable: true })
  titulo: string;

  // audiencia | vencimiento | recordatorio
  @Column({ nullable: true })
  tipo: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha: Date;

  @Column({ default: false })
  completado: boolean;

  @CreateDateColumn()
  created_at: Date;
}
