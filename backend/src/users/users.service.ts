import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import * as bcrypt from 'bcryptjs';
import { sanitizeText } from '../common/utils/sanitize';

export class CreateUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  nombre_estudio: string;
}

export class UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  password?: string;
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

    const hash = await bcrypt.hash(dto.password, 12);
    const usuario = this.usuarioRepository.create({
      nombre: sanitizeText(dto.nombre),
      email: dto.email.toLowerCase(),
      password: hash,
    });
    return this.usuarioRepository.save(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (dto.nombre) usuario.nombre = sanitizeText(dto.nombre);
    if (dto.email && dto.email.toLowerCase() !== usuario.email) {
      const existe = await this.findByEmail(dto.email.toLowerCase());
      if (existe) throw new ConflictException('Ya existe un usuario con ese email');
      usuario.email = dto.email.toLowerCase();
    }
    if (dto.password) usuario.password = await bcrypt.hash(dto.password, 12);
    return this.usuarioRepository.save(usuario);
  }

  async validatePassword(usuario: Usuario, password: string): Promise<boolean> {
    return bcrypt.compare(password, usuario.password);
  }

  /**
   * Create a user with an explicit role. Used by the admin module to provision
   * tenant ('estudio') accounts and to bootstrap the very first 'admin' account.
   * Mirrors `create()` for hashing/sanitization but does not require
   * `nombre_estudio`, since admins are not bound to an estudio.
   */
  async createWithRole(input: {
    nombre: string;
    email: string;
    password: string;
    role: 'admin' | 'estudio';
  }): Promise<Usuario> {
    const existe = await this.findByEmail(input.email.toLowerCase());
    if (existe) throw new ConflictException('Ya existe un usuario con ese email');

    const hash = await bcrypt.hash(input.password, 12);
    const usuario = this.usuarioRepository.create({
      nombre: sanitizeText(input.nombre),
      email: input.email.toLowerCase(),
      password: hash,
      role: input.role,
    });
    return this.usuarioRepository.save(usuario);
  }

  async countByRole(role: 'admin' | 'estudio'): Promise<number> {
    return this.usuarioRepository.count({ where: { role } });
  }

  async deleteById(id: number): Promise<void> {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    await this.usuarioRepository.remove(usuario);
  }
}
