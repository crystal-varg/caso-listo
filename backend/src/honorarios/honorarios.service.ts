import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Honorario } from './honorario.entity';
import { Consulta } from '../consultas/consulta.entity';
import { CreateHonorarioDto, UpdateHonorarioDto } from './honorario.dto';

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
    // Verify consulta belongs to this user
    const consulta = await this.consultaRepo
      .createQueryBuilder('c')
      .innerJoin('c.estudio', 'e')
      .where('c.id = :id AND e.usuario_id = :userId', { id: dto.consulta_id, userId: usuarioId })
      .getOne();

    if (!consulta) throw new NotFoundException('Consulta no encontrada o no pertenece a tu estudio');

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
    Object.assign(h, dto);
    return this.honorarioRepo.save(h);
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    const h = await this.findOneSecure(id, usuarioId);
    await this.honorarioRepo.remove(h);
  }

  private async findOneSecure(id: number, usuarioId: number): Promise<Honorario> {
    const h = await this.honorarioRepo
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.consulta', 'consulta')
      .innerJoin('consulta.estudio', 'estudio')
      .where('h.id = :id AND estudio.usuario_id = :userId', { id, userId: usuarioId })
      .getOne();

    if (!h) throw new NotFoundException('Honorario no encontrado');
    return h;
  }
}
