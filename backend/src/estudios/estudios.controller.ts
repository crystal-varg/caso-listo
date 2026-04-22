import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { EstudiosService } from './estudios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estudios')
export class EstudiosController {
  constructor(private readonly estudiosService: EstudiosService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mio')
  getMio(@Request() req) {
    return this.estudiosService.findByUsuario(req.user.id);
  }
}
