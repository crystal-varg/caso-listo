import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Consulta } from '../consultas/consulta.entity';

@Entity('honorarios')
export class Honorario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  monto_total: number;

  @Column({ type: 'float', default: 0 })
  monto_pagado: number;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @ManyToOne(() => Consulta, { eager: true })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta;

  @Column()
  consulta_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
