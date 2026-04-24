import {
  Controller, Get, Query, Request, UseGuards, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActividadService } from './actividad.service';
import { Consulta } from '../consultas/consulta.entity';
import { assertOwnership } from '../common/utils/ownership';

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
    const id = parseInt(consultaId, 10);
    if (!id || isNaN(id) || id < 1) {
      throw new BadRequestException('consulta_id inválido.');
    }

    // Returns 404 when the consulta doesn't exist OR belongs to another user —
    // same response for both, which is the anti-enumeration contract.
    await assertOwnership(
      this.consultaRepo
        .createQueryBuilder('c')
        .innerJoin('c.estudio', 'e')
        .where('c.id = :id', { id })
        .andWhere('e.usuario_id = :uid', { uid: req.user.id }),
      'Consulta no encontrada',
    );

    return this.actividadService.getByConsulta(id);
  }
}
