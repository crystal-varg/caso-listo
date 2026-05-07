import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, CreateUsuarioDto } from '../users/users.service';
import { EstudiosService } from '../estudios/estudios.service';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordResetService } from './password-reset.service';
import { MailService } from '../mail/mail.service';
import {
  ACCESS_TOKEN_JWT_EXPIRES,
  REFRESH_TOKEN_TTL_MS,
} from './cookie.config';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  usuario: { id: number; nombre: string; email: string; role: 'admin' | 'estudio' };
  estudio: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private estudiosService: EstudiosService,
    private refreshTokenService: RefreshTokenService,
    private passwordResetService: PasswordResetService,
    private mailService: MailService,
  ) {}

  private signAccess(usuarioId: number, email: string, role: 'admin' | 'estudio'): string {
    return this.jwtService.sign(
      { sub: usuarioId, email, role },
      { expiresIn: ACCESS_TOKEN_JWT_EXPIRES, secret: process.env.JWT_SECRET as string },
    );
  }

  /** Backfill a missing role on legacy rows so the JWT payload is always typed. */
  private resolveRole(role: unknown): 'admin' | 'estudio' {
    return role === 'admin' ? 'admin' : 'estudio';
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const usuario = await this.usersService.findByEmail(email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valido = await this.usersService.validatePassword(usuario, password);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    const role = this.resolveRole(usuario.role);
    const accessToken = this.signAccess(usuario.id, usuario.email, role);
    const refresh = await this.refreshTokenService.issue(usuario.id, REFRESH_TOKEN_TTL_MS);
    const estudio = await this.estudiosService.findByUsuario(usuario.id);

    return {
      accessToken,
      refreshToken: refresh.raw,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role },
      estudio,
    };
  }

  async register(dto: CreateUsuarioDto & { nombre_estudio: string }): Promise<AuthResult> {
    const usuario = await this.usersService.create(dto);
    const estudio = await this.estudiosService.create(usuario.id, dto.nombre_estudio);

    const role = this.resolveRole(usuario.role);
    const accessToken = this.signAccess(usuario.id, usuario.email, role);
    const refresh = await this.refreshTokenService.issue(usuario.id, REFRESH_TOKEN_TTL_MS);

    return {
      accessToken,
      refreshToken: refresh.raw,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role },
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

    const role = this.resolveRole(usuario.role);
    const accessToken = this.signAccess(usuario.id, usuario.email, role);
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
        ? {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            role: this.resolveRole(usuario.role),
          }
        : null,
      estudio,
    };
  }

  /**
   * Anti-enumeration: this method always resolves with the same shape (void)
   * regardless of whether the email is registered. Token issuance and email
   * sending only happen when a real user matches.
   */
  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await this.usersService.findByEmail(normalizedEmail);
    if (!usuario) {
      this.logger.log(`forgotPassword: no match for email (silent OK).`);
      return;
    }

    const { raw } = await this.passwordResetService.issue(usuario.id);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://casolisto.online';
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(raw)}`;

    // Fire-and-forget mail with logged errors — never let a transport failure
    // block the API response or leak whether the user exists.
    this.mailService
      .notificarPasswordReset(usuario.email, resetUrl)
      .catch((err) =>
        this.logger.error(`mail password_reset: ${err?.message}`, err?.stack),
      );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const usuarioId = await this.passwordResetService.consume(token);
    if (!usuarioId) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    await this.usersService.update(usuarioId, { password: newPassword });

    // Force re-login on every device — a password reset must invalidate any
    // session that pre-dates the change, including a hypothetical attacker's.
    await this.refreshTokenService.revokeAllForUser(usuarioId);
  }
}
