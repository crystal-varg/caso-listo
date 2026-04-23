import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta, EstadoConsulta } from './consulta.entity';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { MailService } from '../mail/mail.service';
import { EstudiosService } from '../estudios/estudios.service';

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private mailService: MailService,
    private estudiosService: EstudiosService,
  ) {}

  // Endpoint público — cualquier cliente puede enviar consulta a un estudio por slug
  async createPublica(slug: string, dto: CreateConsultaDto): Promise<Consulta> {
    const estudio = await this.estudiosService.findBySlug(slug);
    if (!estudio) throw new NotFoundException('Estudio no encontrado');

    const consulta = this.consultaRepository.create({
      ...dto,
      estudio_id: estudio.id,
    });

    const saved = await this.consultaRepository.save(consulta);

    // Notificar al abogado por email (no bloqueante)
    this.mailService
      .notificarNuevaConsulta(estudio.usuario, saved)
      .catch((err) => console.error('Error enviando email:', err));

    return saved;
  }

  // Panel del abogado — ver sus consultas
  async findByUsuario(
    usuarioId: number,
    filtros?: { estado?: EstadoConsulta; fuero?: string },
  ): Promise<Consulta[]> {
    const query = this.consultaRepository
      .createQueryBuilder('consulta')
      .innerJoin('consulta.estudio', 'estudio')
      .where('estudio.usuario_id = :usuarioId', { usuarioId })
      .orderBy('consulta.created_at', 'DESC');

    if (filtros?.estado) {
      query.andWhere('consulta.estado = :estado', { estado: filtros.estado });
    }
    if (filtros?.fuero) {
      query.andWhere('consulta.fuero = :fuero', { fuero: filtros.fuero });
    }

    return query.getMany();
  }

  async findOne(id: number, usuarioId: number): Promise<Consulta> {
    const consulta = await this.consultaRepository
      .createQueryBuilder('consulta')
      .innerJoin('consulta.estudio', 'estudio')
      .where('consulta.id = :id', { id })
      .andWhere('estudio.usuario_id = :usuarioId', { usuarioId })
      .getOne();

    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    return consulta;
  }

  async update(id: number, usuarioId: number, dto: UpdateConsultaDto): Promise<Consulta> {
    const consulta = await this.findOne(id, usuarioId);
    Object.assign(consulta, dto);
    return this.consultaRepository.save(consulta);
  }

  // Horarios ya reservados para un estudio en una fecha dada
  async getDisponibilidad(
    slug: string,
    fecha: string,
  ): Promise<{ ocupados: string[] }> {
    const estudio = await this.estudiosService.findBySlug(slug);
    if (!estudio) return { ocupados: [] };

    const consultas = await this.consultaRepository.find({
      where: { estudio_id: estudio.id, fecha_preferida: fecha },
      select: ['horario_preferido'],
    });

    const ocupados = consultas
      .map((c) => c.horario_preferido)
      .filter((h): h is string => !!h);

    return { ocupados };
  }

  // Estadísticas para el dashboard
  async getStats(usuarioId: number) {
    const consultas = await this.findByUsuario(usuarioId);
    return {
      total: consultas.length,
      nuevo: consultas.filter((c) => c.estado === EstadoConsulta.NUEVO).length,
      en_proceso: consultas.filter((c) => c.estado === EstadoConsulta.EN_PROCESO).length,
      cerrado: consultas.filter((c) => c.estado === EstadoConsulta.CERRADO).length,
    };
  }
}
