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

  // nullable: true defends against legacy rows; HonorariosService always sets
  // monto_total and fecha_vencimiento via DTO validation, so new rows are
  // guaranteed non-null. monto_pagado has a default so it cannot be null.
  @Column({ type: 'float', nullable: true })
  monto_total: number;

  @Column({ type: 'float', default: 0 })
  monto_pagado: number;

  @Column({ type: 'date', nullable: true })
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
