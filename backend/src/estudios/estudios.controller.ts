import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { EstudiosService } from './estudios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class UpdateEstudioDto {
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
    return this.estudiosService.updateByUsuario(req.user.id, dto.nombre_estudio);
  }
}
