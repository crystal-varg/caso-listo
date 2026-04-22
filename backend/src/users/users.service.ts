import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import * as bcrypt from 'bcryptjs';

export class CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  nombre_estudio: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { id } });
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const existe = await this.findByEmail(dto.email);
    if (existe) throw new ConflictException('Ya existe un usuario con ese email');

    const hash = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hash,
    });
    return this.usuarioRepository.save(usuario);
  }

  async validatePassword(usuario: Usuario, password: string): Promise<boolean> {
    return bcrypt.compare(password, usuario.password);
  }
}
