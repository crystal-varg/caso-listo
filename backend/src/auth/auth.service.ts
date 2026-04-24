import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, CreateUsuarioDto } from '../users/users.service';
import { EstudiosService } from '../estudios/estudios.service';
import { RefreshTokenService } from './refresh-token.service';
import {
  ACCESS_TOKEN_JWT_EXPIRES,
  REFRESH_TOKEN_TTL_MS,
} from './cookie.config';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  usuario: { id: number; nombre: string; email: string };
  estudio: any;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private estudiosService: EstudiosService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  private signAccess(usuarioId: number, email: string): string {
    return this.jwtService.sign(
      { sub: usuarioId, email },
      { expiresIn: ACCESS_TOKEN_JWT_EXPIRES, secret: process.env.JWT_SECRET as string },
    );
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const usuario = await this.usersService.findByEmail(email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valido = await this.usersService.validatePassword(usuario, password);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    const accessToken = this.signAccess(usuario.id, usuario.email);
    const refresh = await this.refreshTokenService.issue(usuario.id, REFRESH_TOKEN_TTL_MS);
    const estudio = await this.estudiosService.findByUsuario(usuario.id);

    return {
      accessToken,
      refreshToken: refresh.raw,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      estudio,
    };
  }

  async register(dto: CreateUsuarioDto & { nombre_estudio: string }): Promise<AuthResult> {
    const usuario = await this.usersService.create(dto);
    const estudio = await this.estudiosService.create(usuario.id, dto.nombre_estudio);

    const accessToken = this.signAccess(usuario.id, usuario.email);
    const refresh = await this.refreshTokenService.issue(usuario.id, REFRESH_TOKEN_TTL_MS);

    return {
      accessToken,
      refreshToken: refresh.raw,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      estudio,
    };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { usuarioId, issued } = await this.refreshTokenService.rotate(
      rawRefreshToken,
      REFRESH_TOKEN_TTL_MS,
    );
    const usuario = await this.usersService.findById(usuarioId);
    if (!usuario) throw new UnauthorizedException('Token inválido.');

    const accessToken = this.signAccess(usuario.id, usuario.email);
    return { accessToken, refreshToken: issued.raw };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenService.revoke(rawRefreshToken);
    }
  }

  async logoutAll(usuarioId: number): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(usuarioId);
  }

  async getMe(usuarioId: number) {
    const usuario = await this.usersService.findById(usuarioId);
    const estudio = await this.estudiosService.findByUsuario(usuarioId);
    return {
      usuario: usuario
        ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
        : null,
      estudio,
    };
  }
}
