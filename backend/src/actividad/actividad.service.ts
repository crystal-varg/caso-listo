import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './actividad.entity';

@Injectable()
export class ActividadService {
  constructor(
    @InjectRepository(Actividad)
    private actividadRepo: Repository<Actividad>,
  ) {}

  async registrar(
    consultaId: number,
    tipo: string,
    descripcion?: string,
  ): Promise<Actividad> {
    const actividad = this.actividadRepo.create({ consulta_id: consultaId, tipo, descripcion });
    return this.actividadRepo.save(actividad);
  }

  async getByConsulta(consultaId: number): Promise<Actividad[]> {
    return this.actividadRepo.find({
      where: { consulta_id: consultaId },
      order: { created_at: 'DESC' },
    });
  }

  async ultimaActividad(consultaId: number): Promise<Date | null> {
    const result = await this.actividadRepo
      .createQueryBuilder('a')
      .select('MAX(a.created_at)', 'max')
      .where('a.consulta_id = :consultaId', { consultaId })
      .getRawOne<{ max: string | null }>();
    return result?.max ? new Date(result.max) : null;
  }
}
