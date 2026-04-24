import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Honorario } from './honorario.entity';
import { Consulta } from '../consultas/consulta.entity';
import { CreateHonorarioDto, UpdateHonorarioDto } from './honorario.dto';
import { assertOwnership } from '../common/utils/ownership';

@Injectable()
export class HonorariosService {
  constructor(
    @InjectRepository(Honorario)
    private honorarioRepo: Repository<Honorario>,
    @InjectRepository(Consulta)
    private consultaRepo: Repository<Consulta>,
  ) {}

  async findByUsuario(usuarioId: number): Promise<Honorario[]> {
    return this.honorarioRepo
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.consulta', 'consulta')
      .innerJoin('consulta.estudio', 'estudio')
      .where('estudio.usuario_id = :usuarioId', { usuarioId })
      .orderBy('h.fecha_vencimiento', 'ASC')
      .getMany();
  }

  async create(usuarioId: number, dto: CreateHonorarioDto): Promise<Honorario> {
    await assertOwnership(
      this.consultaRepo
        .createQueryBuilder('c')
        .innerJoin('c.estudio', 'e')
        .where('c.id = :id', { id: dto.consulta_id })
        .andWhere('e.usuario_id = :uid', { uid: usuarioId }),
      'Consulta no encontrada',
    );

    const honorario = this.honorarioRepo.create({
      monto_total: dto.monto_total,
      monto_pagado: dto.monto_pagado ?? 0,
      fecha_vencimiento: dto.fecha_vencimiento,
      consulta_id: dto.consulta_id,
    });
    return this.honorarioRepo.save(honorario);
  }

  async update(id: number, usuarioId: number, dto: UpdateHonorarioDto): Promise<Honorario> {
    const h = await this.findOneSecure(id, usuarioId);
    if (dto.monto_total !== undefined) h.monto_total = dto.monto_total;
    if (dto.monto_pagado !== undefined) h.monto_pagado = dto.monto_pagado;
    if (dto.fecha_vencimiento !== undefined) h.fecha_vencimiento = dto.fecha_vencimiento;
    return this.honorarioRepo.save(h);
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    const h = await this.findOneSecure(id, usuarioId);
    await this.honorarioRepo.remove(h);
  }

  private async findOneSecure(id: number, usuarioId: number): Promise<Honorario> {
    return assertOwnership(
      this.honorarioRepo
        .createQueryBuilder('h')
        .innerJoinAndSelect('h.consulta', 'consulta')
        .innerJoin('consulta.estudio', 'estudio')
        .where('h.id = :id', { id })
        .andWhere('estudio.usuario_id = :uid', { uid: usuarioId }),
      'Honorario no encontrado',
    );
  }
}
