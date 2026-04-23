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

  @Column()
  titulo: string;

  // audiencia | vencimiento | recordatorio
  @Column({ nullable: true })
  tipo: string;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ default: false })
  completado: boolean;

  @CreateDateColumn()
  created_at: Date;
}
