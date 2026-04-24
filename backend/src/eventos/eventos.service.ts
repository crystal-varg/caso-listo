import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './evento.entity';
import { Consulta } from '../consultas/consulta.entity';
import { ActividadService } from '../actividad/actividad.service';
import { CreateEventoDto, UpdateEventoDto } from './evento.dto';
import { assertOwnership } from '../common/utils/ownership';
import { sanitizeText } from '../common/utils/sanitize';

@Injectable()
export class EventosService {
  private readonly logger = new Logger(EventosService.name);

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
    await assertOwnership(
      this.consultaRepo
        .createQueryBuilder('c')
        .innerJoin('c.estudio', 'e')
        .where('c.id = :id', { id: dto.consulta_id })
        .andWhere('e.usuario_id = :uid', { uid: usuarioId }),
      'Consulta no encontrada',
    );

    const titulo = sanitizeText(dto.titulo);
    const evento = this.eventoRepo.create({
      titulo,
      tipo: dto.tipo,
      fecha: new Date(dto.fecha),
      consulta_id: dto.consulta_id,
    });
    const saved = await this.eventoRepo.save(evento);

    this.actividadService
      .registrar(dto.consulta_id, 'evento_creado', `Evento creado: ${titulo}`)
      .catch((err) =>
        this.logger.error(`registrar evento_creado: ${err?.message}`, err?.stack),
      );

    return saved;
  }

  async update(id: number, usuarioId: number, dto: UpdateEventoDto): Promise<Evento> {
    const evento = await this.findOneSecure(id, usuarioId);
    if (dto.titulo !== undefined) evento.titulo = sanitizeText(dto.titulo);
    if (dto.fecha !== undefined) evento.fecha = new Date(dto.fecha);
    if (dto.tipo !== undefined) evento.tipo = dto.tipo;
    if (dto.completado !== undefined) evento.completado = dto.completado;
    return this.eventoRepo.save(evento);
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    const evento = await this.findOneSecure(id, usuarioId);
    await this.eventoRepo.remove(evento);
  }

  private async findOneSecure(id: number, usuarioId: number): Promise<Evento> {
    return assertOwnership(
      this.eventoRepo
        .createQueryBuilder('e')
        .innerJoin('e.consulta', 'c')
        .innerJoin('c.estudio', 'est')
        .where('e.id = :id', { id })
        .andWhere('est.usuario_id = :uid', { uid: usuarioId }),
      'Evento no encontrado',
    );
  }
}
