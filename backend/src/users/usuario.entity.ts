import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Estudio } from '../estudios/estudio.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre: string;

  @Column({ unique: true, length: 254 })
  email: string;

  /**
   * The bcrypt password hash. `@Exclude()` guarantees it is stripped from any
   * response serialized through `ClassSerializerInterceptor` — even if a service
   * method accidentally returns the whole entity. Defence in depth.
   */
  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Column({ default: true })
  activo: boolean;

  @OneToOne(() => Estudio, (estudio) => estudio.usuario)
  estudio: Estudio;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
