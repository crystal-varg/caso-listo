import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta, EstadoConsulta } from './consulta.entity';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { MailService } from '../mail/mail.service';
import { EstudiosService } from '../estudios/estudios.service';
import { ActividadService } from '../actividad/actividad.service';

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private mailService: MailService,
    private estudiosService: EstudiosService,
    private actividadService: ActividadService,
  ) {}

  async createPublica(
    slug: string,
    dto: CreateConsultaDto,
    archivos?: { dniArchivo?: string | null; docsArchivo?: string | null },
  ): Promise<Consulta> {
    const estudio = await this.estudiosService.findBySlug(slug);
    if (!estudio) throw new NotFoundException('Estudio no encontrado');

    const consulta = this.consultaRepository.create({
      ...dto,
      estudio_id: estudio.id,
      dni_archivo: archivos?.dniArchivo ?? null,
      docs_archivo: archivos?.docsArchivo ?? null,
    });

    const saved = await this.consultaRepository.save(consulta);

    // Register activity (non-blocking)
    this.actividadService
      .registrar(saved.id, 'consulta_creada', 'Nueva consulta recibida')
      .catch((err) => console.error('Error registrando actividad:', err));

    if (archivos?.dniArchivo && archivos.dniArchivo !== 'faltante') {
      this.actividadService
        .registrar(saved.id, 'documento_subido', 'DNI adjuntado')
        .catch(() => {});
    }
    if (archivos?.docsArchivo && archivos.docsArchivo !== 'faltante') {
      this.actividadService
        .registrar(saved.id, 'documento_subido', 'Documentación adjuntada')
        .catch(() => {});
    }

    // Notify lawyer by email (non-blocking)
    this.mailService
      .notificarNuevaConsulta(estudio.usuario, saved)
      .catch((err) => console.error('Error enviando email:', err));

    return saved;
  }

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
    const estadoAnterior = consulta.estado;
    Object.assign(consulta, dto);
    const saved = await this.consultaRepository.save(consulta);

    if (dto.estado && dto.estado !== estadoAnterior) {
      this.actividadService
        .registrar(id, 'estado_cambiado', `Estado cambiado a ${dto.estado}`)
        .catch(() => {});
    }

    return saved;
  }

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

  async getStats(usuarioId: number) {
    const consultas = await this.findByUsuario(usuarioId);
    return {
      total: consultas.length,
      nuevo: consultas.filter((c) => c.estado === EstadoConsulta.NUEVO).length,
      en_proceso: consultas.filter((c) => c.estado === EstadoConsulta.EN_PROCESO).length,
      cerrado: consultas.filter((c) => c.estado === EstadoConsulta.CERRADO).length,
    };
  }

  // Returns open consultas with no activity (or last activity) older than 30 days.
  // Falls back to updated_at when no activity rows exist yet.
  async findSinMovimiento(usuarioId: number): Promise<any[]> {
    return this.consultaRepository.query(
      `SELECT
        c.id,
        c.nombre_cliente,
        c.tipo_caso,
        c.fuero,
        c.estado,
        c.updated_at,
        COALESCE(MAX(a.created_at), c.updated_at) AS ultima_actividad,
        EXTRACT(DAY FROM NOW() - COALESCE(MAX(a.created_at), c.updated_at))::int AS dias_sin_movimiento
      FROM consultas c
      INNER JOIN estudios e ON e.id = c.estudio_id
      LEFT JOIN actividad a ON a.consulta_id = c.id
      WHERE e.usuario_id = $1
        AND c.estado != 'cerrado'
      GROUP BY c.id
      HAVING COALESCE(MAX(a.created_at), c.updated_at) < NOW() - INTERVAL '30 days'
      ORDER BY ultima_actividad ASC`,
      [usuarioId],
    );
  }
}
