import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './evento.entity';
import { Consulta } from '../consultas/consulta.entity';
import { ActividadService } from '../actividad/actividad.service';
import { CreateEventoDto, UpdateEventoDto } from './evento.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private eventoRepo: Repository<Evento>,
    @InjectRepository(Consulta)
    private consultaRepo: Repository<Consulta>,
    private actividadService: ActividadService,
  ) {}

  async findByUsuario(usuarioId: number, consultaId?: number): Promise<Evento[]> {
    const query = this.eventoRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.consulta', 'c')
      .innerJoin('c.estudio', 'est')
      .where('est.usuario_id = :usuarioId', { usuarioId })
      .orderBy('e.fecha', 'ASC');

    if (consultaId) {
      query.andWhere('e.consulta_id = :consultaId', { consultaId });
    }

    return query.getMany();
  }

  async create(usuarioId: number, dto: CreateEventoDto): Promise<Evento> {
    const consulta = await this.consultaRepo
      .createQueryBuilder('c')
      .innerJoin('c.estudio', 'e')
      .where('c.id = :id AND e.usuario_id = :userId', { id: dto.consulta_id, userId: usuarioId })
      .getOne();

    if (!consulta) throw new NotFoundException('Consulta no encontrada o no pertenece a tu estudio');

    const evento = this.eventoRepo.create({
      titulo: dto.titulo,
      tipo: dto.tipo,
      fecha: new Date(dto.fecha),
      consulta_id: dto.consulta_id,
    });

    const saved = await this.eventoRepo.save(evento);

    await this.actividadService.registrar(
      dto.consulta_id,
      'evento_creado',
      `Evento creado: ${dto.titulo}`,
    );

    return saved;
  }

  async update(id: number, usuarioId: number, dto: UpdateEventoDto): Promise<Evento> {
    const evento = await this.findOneSecure(id, usuarioId);
    Object.assign(evento, dto);
    return this.eventoRepo.save(evento);
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    const evento = await this.findOneSecure(id, usuarioId);
    await this.eventoRepo.remove(evento);
  }

  private async findOneSecure(id: number, usuarioId: number): Promise<Evento> {
    const evento = await this.eventoRepo
      .createQueryBuilder('e')
      .innerJoin('e.consulta', 'c')
      .innerJoin('c.estudio', 'est')
      .where('e.id = :id AND est.usuario_id = :userId', { id, userId: usuarioId })
      .getOne();

    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }
}
