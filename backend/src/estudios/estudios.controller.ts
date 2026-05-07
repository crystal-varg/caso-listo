import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EstudiosService } from './estudios.service';
import { EstudioConfig } from './estudio.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { sanitizeText } from '../common/utils/sanitize';

class UpdateEstudioDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombre_estudio: string;

  @IsOptional() @IsObject()
  config?: EstudioConfig;
}

@Controller('estudios')
export class EstudiosController {
  constructor(private readonly estudiosService: EstudiosService) {}

  // Must precede `GET mio` so the static-segment match is unambiguous to a
  // future reader, even though Nest disambiguates literal vs. param routes.
  // No JwtAuthGuard — this powers the public landing page for each tenant.
  @Get('publico/:slug')
  async getPublico(@Param('slug') slug: string) {
    const estudio = await this.estudiosService.findPublicBySlug(slug);
    if (!estudio) throw new NotFoundException('Estudio no encontrado');
    return estudio;
  }

  @UseGuards(JwtAuthGuard)
  @Get('mio')
  getMio(@Request() req) {
    return this.estudiosService.findByUsuario(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mio')
  updateMio(@Request() req, @Body() dto: UpdateEstudioDto) {
    return this.estudiosService.updateByUsuario(
      req.user.id,
      sanitizeText(dto.nombre_estudio),
      dto.config,
    );
  }
}
