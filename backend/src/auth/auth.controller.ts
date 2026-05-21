import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Response,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional, Matches, IsString, Length } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  clearAccessCookieOptions,
  clearRefreshCookieOptions,
} from './cookie.config';
import { sanitizeText } from '../common/utils/sanitize';

class LoginDto {
  @IsEmail() @MaxLength(254)
  email: string;

  @IsNotEmpty() @MaxLength(128)
  password: string;
}

class RegisterDto {
  @IsNotEmpty() @MaxLength(120)
  nombre: string;

  @IsEmail() @MaxLength(254)
  email: string;

  @MinLength(8) @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una letra y un número.',
  })
  password: string;

  @IsNotEmpty() @MaxLength(120)
  nombre_estudio: string;
}

class UpdateProfileDto {
  @IsOptional() @IsNotEmpty() @MaxLength(120)
  nombre?: string;

  @IsOptional() @IsEmail() @MaxLength(254)
  email?: string;

  @IsOptional() @MinLength(8) @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una letra y un número.',
  })
  password?: string;
}

class ForgotPasswordDto {
  @IsEmail() @MaxLength(254)
  email: string;
}

class ResetPasswordDto {
  @IsString() @Length(64, 64)
  @Matches(/^[a-f0-9]{64}$/, { message: 'Token con formato inválido.' })
  token: string;

  @MinLength(8) @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una letra y un número.',
  })
  password: string;
}

function setAuthCookies(
  res: ExpressResponse,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());
}

function clearAuthCookies(res: ExpressResponse): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, clearAccessCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshCookieOptions());
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  async login(
    @Body() dto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(dto.email, dto.password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { usuario: result.usuario, estudio: result.estudio };
  }

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  async register(
    @Body() dto: RegisterDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const sanitized = {
      ...dto,
      nombre: sanitizeText(dto.nombre),
      nombre_estudio: sanitizeText(dto.nombre_estudio),
    };
    const result = await this.authService.register(sanitized);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { usuario: result.usuario, estudio: result.estudio };
  }

  @Post('refresh')
  @HttpCode(200)
  @SkipThrottle()
  @Throttle({ default: { limit: 60, ttl: 15 * 60 * 1000 } })
  async refresh(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    if (req.headers['authorization']) {
      throw new UnauthorizedException('Bearer authentication is not supported.');
    }
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!raw || typeof raw !== 'string') {
      throw new UnauthorizedException('Refresh token ausente.');
    }
    const { accessToken, refreshToken } = await this.authService.refresh(raw);
    setAuthCookies(res, accessToken, refreshToken);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(typeof raw === 'string' ? raw : undefined);
    clearAuthCookies(res);
    return;
  }

  /**
   * Always returns the same response whether the email exists or not — the
   * actual success path runs asynchronously via fire-and-forget email send.
   */
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      ok: true,
      mensaje:
        'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return {
      ok: true,
      mensaje: 'Contraseña actualizada. Iniciá sesión nuevamente.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const sanitized: UpdateProfileDto = { ...dto };
    if (sanitized.nombre) sanitized.nombre = sanitizeText(sanitized.nombre);
    const updated = await this.usersService.update(req.user.id, sanitized);
    return { id: updated.id, nombre: updated.nombre, email: updated.email };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    await this.authService.logoutAll(req.user.id);
    clearAuthCookies(res);
    return;
  }
}
