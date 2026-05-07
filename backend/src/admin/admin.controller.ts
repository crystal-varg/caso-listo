import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { EstudioConfig } from '../estudios/estudio.entity';
import { SLUG_REGEX } from '../common/utils/slug';

const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const MAX_CSV_BYTES = 5 * 1024 * 1024;

class CrearEstudioDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombre: string;

  @IsEmail() @MaxLength(254)
  email: string;

  @IsString() @MinLength(8) @MaxLength(128)
  @Matches(STRONG_PASSWORD, {
    message: 'La contraseña debe contener al menos una letra y un número.',
  })
  password: string;

  @IsString() @Matches(SLUG_REGEX, { message: 'Slug con formato inválido.' })
  slug: string;

  @IsObject()
  config: EstudioConfig;
}

class ActualizarConfigDto {
  @IsObject()
  config: Partial<EstudioConfig>;
}

class EliminarEstudioDto {
  @IsBoolean()
  confirmar: boolean;
}

class CrearAdminDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombre: string;

  @IsEmail() @MaxLength(254)
  email: string;

  @IsString() @MinLength(8) @MaxLength(128)
  @Matches(STRONG_PASSWORD, {
    message: 'La contraseña debe contener al menos una letra y un número.',
  })
  password: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Bootstrap (no guards) ─────────────────────────────────────────────────
  // Throttled aggressively because it is unauthenticated. Once an admin exists,
  // every subsequent call returns 403 — this is the system's one-shot init.
  @Post('auth/crear-admin')
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  crearAdmin(@Body() dto: CrearAdminDto) {
    return this.adminService.crearAdminBootstrap(dto);
  }

  // ── Authenticated admin surface ───────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('estudios')
  listEstudios() {
    return this.adminService.listEstudios();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('estudios')
  crearEstudio(@Body() dto: CrearEstudioDto) {
    return this.adminService.crearEstudio(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('estudios/:slug')
  actualizarEstudio(
    @Param('slug') slug: string,
    @Body() dto: ActualizarConfigDto,
  ) {
    return this.adminService.actualizarConfig(slug, dto.config);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('estudios/:slug')
  @HttpCode(200)
  eliminarEstudio(
    @Param('slug') slug: string,
    @Body() dto: EliminarEstudioDto,
  ) {
    return this.adminService.eliminarEstudio(slug, dto.confirmar);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('estudios/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      // Memory storage — never write tenant credentials to disk, even briefly.
      storage: memoryStorage(),
      limits: { fileSize: MAX_CSV_BYTES },
    }),
  )
  async importarCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo "file" requerido.');
    return this.adminService.importarCsv(file.buffer);
  }
}
