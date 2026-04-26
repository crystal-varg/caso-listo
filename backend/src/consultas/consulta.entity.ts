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

export enum UrgenciaConsulta {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
}

/**
 * Auto-computed lead-quality score derived from intake content
 * (see ConsultaScoreService). Persisted on every create + recalculate call so
 * the list view can sort/filter without recomputing on each request.
 */
export enum ScoreCategoria {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAJO = 'BAJO',
}

@Entity('consultas')
export class Consulta {
  @PrimaryGeneratedColumn()
  id: number;

  // nullable: true is required because production rows predate the NOT NULL
  // tightening — flipping it would crash TypeORM `synchronize` on startup. We
  // still validate non-empty at the DTO layer (CreateConsultaDto.nombre_cliente
  // is @IsNotEmpty), so the application never accepts new null values.
  @Column({ nullable: true, length: 120 })
  nombre_cliente: string;

  @Column({ nullable: true, length: 254 })
  email: string;

  @Column({ nullable: true, length: 32 })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  mensaje: string;

  @Column({ nullable: true, length: 80 })
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

  @Column({ nullable: true, length: 16 })
  urgencia: string;

  @Column({ nullable: true, length: 10 })
  fecha_preferida: string;

  @Column({ nullable: true, length: 16 })
  horario_preferido: string;

  @Column({ nullable: true, length: 120 })
  dni_archivo: string;

  @Column({ nullable: true, length: 120 })
  docs_archivo: string;

  // Auto-scoring columns. Defaults guarantee legacy rows remain consistent
  // through `synchronize` — they get score=0 / score_category=BAJO until the
  // recalculate endpoint is invoked. nullable: true is defensive against the
  // same legacy-data pitfalls we hit on other text columns.
  @Column({ type: 'int', default: 0, nullable: true })
  score: number;

  @Column({
    type: 'enum',
    enum: ScoreCategoria,
    default: ScoreCategoria.BAJO,
    nullable: true,
  })
  score_category: ScoreCategoria;

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
