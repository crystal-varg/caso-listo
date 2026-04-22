import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, CreateUsuarioDto } from '../users/users.service';
import { EstudiosService } from '../estudios/estudios.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private estudiosService: EstudiosService,
  ) {}

  async login(email: string, password: string) {
    const usuario = await this.usersService.findByEmail(email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valido = await this.usersService.validatePassword(usuario, password);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    const payload = { sub: usuario.id, email: usuario.email };
    const token = this.jwtService.sign(payload);

    const estudio = await this.estudiosService.findByUsuario(usuario.id);

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      estudio,
    };
  }

  async register(dto: CreateUsuarioDto & { nombre_estudio: string }) {
    const usuario = await this.usersService.create(dto);
    const estudio = await this.estudiosService.create(usuario.id, dto.nombre_estudio);

    const payload = { sub: usuario.id, email: usuario.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      estudio,
    };
  }

  async getMe(usuarioId: number) {
    const usuario = await this.usersService.findById(usuarioId);
    const estudio = await this.estudiosService.findByUsuario(usuarioId);
    return { usuario, estudio };
  }
}
