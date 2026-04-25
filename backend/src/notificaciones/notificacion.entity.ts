import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id: number;

  @Column({ nullable: true })
  consulta_id: number | null;

  // nullable: true defends against legacy rows; NotificacionesService.crear
  // always populates these fields, so new rows remain non-null.
  // consulta_nueva | evento_proximo | caso_sin_movimiento | honorario_vencido
  @Column({ nullable: true })
  tipo: string;

  // in_app | email | whatsapp
  @Column({ nullable: true })
  canal: string;

  @Column({ nullable: true })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  mensaje: string;

  // ID of related evento or honorario — used for dedup
  @Column({ nullable: true })
  referencia_id: number | null;

  // 'evento' | 'honorario'
  @Column({ nullable: true })
  referencia_tipo: string | null;

  // pre-built WA link for whatsapp notifications
  @Column({ nullable: true, type: 'text' })
  wa_link: string | null;

  @Column({ default: false })
  leido: boolean;

  @Column({ default: false })
  enviado: boolean;

  @CreateDateColumn()
  created_at: Date;
}
