import { Controller, Get, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActividadService } from './actividad.service';
import { Consulta } from '../consultas/consulta.entity';

@Controller('actividad')
@UseGuards(JwtAuthGuard)
export class ActividadController {
  constructor(
    private readonly actividadService: ActividadService,
    @InjectRepository(Consulta)
    private consultaRepo: Repository<Consulta>,
  ) {}

  @Get()
  async getByConsulta(@Query('consulta_id') consultaId: string, @Request() req) {
    const id = parseInt(consultaId);
    if (!id) return [];

    // Verify ownership before exposing activity log
    const consulta = await this.consultaRepo
      .createQueryBuilder('c')
      .innerJoin('c.estudio', 'e')
      .where('c.id = :id AND e.usuario_id = :userId', { id, userId: req.user.id })
      .getOne();

    if (!consulta) throw new ForbiddenException('Consulta no encontrada');

    return this.actividadService.getByConsulta(id);
  }
}
