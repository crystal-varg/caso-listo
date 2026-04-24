import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EstudiosService } from './estudios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { sanitizeText } from '../common/utils/sanitize';

class UpdateEstudioDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombre_estudio: string;
}

@Controller('estudios')
export class EstudiosController {
  constructor(private readonly estudiosService: EstudiosService) {}

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
    );
  }
}
