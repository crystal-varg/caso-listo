import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../users/usuario.entity';
import { Consulta } from '../consultas/consulta.entity';

@Entity('estudios')
export class Estudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre_estudio: string;

  @Column({ nullable: true })
  slug: string; // URL única para el formulario público: /consulta/slug

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
