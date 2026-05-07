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

  // nullable: true on every user-data column — legacy production rows may
  // carry NULL and tightening would crash TypeORM `synchronize`. Application
  // code (auth.service.ts, users.service.ts) always populates these on
  // register and update, so new rows remain non-null in practice. The unique
  // constraint on email still works because PostgreSQL treats NULL as
  // distinct in a unique index.
  @Column({ nullable: true, length: 120 })
  nombre: string;

  @Column({ unique: true, nullable: true, length: 254 })
  email: string;

  /**
   * The bcrypt password hash. `@Exclude()` guarantees it is stripped from any
   * response serialized through `ClassSerializerInterceptor` — even if a service
   * method accidentally returns the whole entity. Defence in depth.
   */
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  password: string;

  @Column({ default: true })
  activo: boolean;

  // 'estudio' is the default for self-registered tenants. 'admin' is granted
  // exclusively through the admin module and never via the public register flow.
  @Column({ default: 'estudio' })
  role: 'admin' | 'estudio';

  @OneToOne(() => Estudio, (estudio) => estudio.usuario)
  estudio: Estudio;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
