import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Estudio } from '../estudios/estudio.entity';

export enum EstadoConsulta {
  NUEVO = 'nuevo',
  EN_PROCESO = 'en_proceso',
  CERRADO = 'cerrado',
}

export enum FueroConsulta {
  LABORAL = 'Laboral',
  PENAL = 'Penal',
  FAMILIA = 'Familia',
  CIVIL_COMERCIAL = 'Civil / Comercial',
  ADMINISTRATIVO = 'Administrativo',
  TRIBUTARIO = 'Tributario',
  PREVISIONAL = 'Previsional',
  SIN_DEFINIR = 'Sin definir',
}

@Entity('consultas')
export class Consulta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre_cliente: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ nullable: true })
  tipo_caso: string;

  @Column({
    type: 'enum',
    enum: EstadoConsulta,
    default: EstadoConsulta.NUEVO,
  })
  estado: EstadoConsulta;

  @Column({
    type: 'enum',
    enum: FueroConsulta,
    default: FueroConsulta.SIN_DEFINIR,
  })
  fuero: FueroConsulta;

  @Column({ nullable: true })
  urgencia: string; // baja | media | alta

  @Column({ nullable: true })
  fecha_preferida: string; // YYYY-MM-DD

  @Column({ nullable: true })
  horario_preferido: string; // 9:00 | 11:00 | 14:00 | 16:00 | 18:00

  // null = pendiente | 'faltante' = no tiene | <filename> = subido
  @Column({ nullable: true })
  dni_archivo: string;

  @Column({ nullable: true })
  docs_archivo: string;

  @ManyToOne(() => Estudio, (estudio) => estudio.consultas)
  @JoinColumn({ name: 'estudio_id' })
  estudio: Estudio;

  @Column()
  estudio_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
