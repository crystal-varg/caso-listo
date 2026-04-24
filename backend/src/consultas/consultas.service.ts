import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta, EstadoConsulta, FueroConsulta } from './consulta.entity';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { MailService } from '../mail/mail.service';
import { EstudiosService } from '../estudios/estudios.service';
import { ActividadService } from '../actividad/actividad.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { sanitizeText, sanitizeFields } from '../common/utils/sanitize';
import { assertOwnership } from '../common/utils/ownership';

interface ArchivosInfo {
  dniArchivo?: string | null;
  docsArchivo?: string | null;
}

@Injectable()
export class ConsultasService {
  private readonly logger = new Logger(ConsultasService.name);

  constructor(
    @InjectRepository(Consulta)
    private consultaRepository: Repository<Consulta>,
    private mailService: MailService,
    private estudiosService: EstudiosService,
    private actividadService: ActividadService,
    private notificacionesService: NotificacionesService,
  ) {}

  /**
   * Public intake. Anti-enumeration: returns the same success-shaped response
   * whether the slug exists or not, and pads the not-found path with a small
   * constant delay so wall-clock timing cannot distinguish the two cases.
   *
   * Blocklisted slugs are already rejected in the controller with 404 — they
   * can never legitimately exist in the DB, so returning 404 there is not an
   * enumeration signal (blocklist is publicly knowable).
   */
  async createPublica(
    slug: string,
    dto: CreateConsultaDto,
    archivos?: ArchivosInfo,
  ): Promise<{ ok: true; mensaje: string; id: number | null }> {
    const estudio = await this.estudiosService.findBySlug(slug);

    const successMessage = {
      ok: true as const,
      mensaje: 'Tu consulta fue enviada. Te contactaremos a la brevedad.',
    };

    if (!estudio) {
      // Anti-enumeration: perform ~15-30ms of work so timing matches the real path.
      await this.dummyDelay();
      return { ...successMessage, id: null };
    }

    // Sanitize every free-text field — defence in depth, regardless of DTO.
    const safe = sanitizeFields(dto, [
      'nombre_cliente',
      'mensaje',
      'tipo_caso',
      'urgencia',
      'fecha_preferida',
      'horario_preferido',
      'dni_estado',
      'docs_estado',
    ]);

    const consulta = this.consultaRepository.create({
      nombre_cliente: safe.nombre_cliente,
      email: dto.email.toLowerCase(),
      telefono: dto.telefono,
      mensaje: safe.mensaje,
      tipo_caso: safe.tipo_caso,
      urgencia: safe.urgencia,
      fecha_preferida: safe.fecha_preferida,
      horario_preferido: safe.horario_preferido,
      estudio_id: estudio.id,
      dni_archivo: archivos?.dniArchivo ?? null,
      docs_archivo: archivos?.docsArchivo ?? null,
    });

    const saved = await this.consultaRepository.save(consulta);

    // Fire-and-forget side effects with observable error handling.
    this.actividadService
      .registrar(saved.id, 'consulta_creada', 'Nueva consulta recibida')
      .catch((err) => this.logger.error(`registrar consulta_creada: ${err?.message}`, err?.stack));

    this.notificacionesService
      .crear({
        usuario_id: estudio.usuario_id,
        consulta_id: saved.id,
        tipo: 'consulta_nueva',
        canal: 'in_app',
        titulo: 'Nueva consulta recibida',
        mensaje: `Tenés una nueva consulta de ${saved.nombre_cliente}.`,
      })
      .catch((err) => this.logger.error(`crear notificacion: ${err?.message}`, err?.stack));

    if (archivos?.dniArchivo && archivos.dniArchivo !== 'faltante') {
      this.actividadService
        .registrar(saved.id, 'documento_subido', 'DNI adjuntado')
        .catch((err) => this.logger.error(`registrar dni: ${err?.message}`, err?.stack));
    }
    if (archivos?.docsArchivo && archivos.docsArchivo !== 'faltante') {
      this.actividadService
        .registrar(saved.id, 'documento_subido', 'Documentación adjuntada')
        .catch((err) => this.logger.error(`registrar docs: ${err?.message}`, err?.stack));
    }

    this.mailService
      .notificarNuevaConsulta(estudio.usuario, saved)
      .catch((err) => this.logger.error(`mail nueva consulta: ${err?.message}`, err?.stack));

    return { ...successMessage, id: saved.id };
  }

  private async dummyDelay(): Promise<void> {
    // Small random delay in [15, 30) ms — rough approximation of a single INSERT.
    const ms = 15 + Math.floor(Math.random() * 15);
    await new Promise((resolve) => setTimeout(resolve, ms));
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
      // Belt-and-suspenders enum check — controller already validates.
      if (!Object.values(FueroConsulta).includes(filtros.fuero as FueroConsulta)) {
        return [];
      }
      query.andWhere('consulta.fuero = :fuero', { fuero: filtros.fuero });
    }

    return query.getMany();
  }

  async findOne(id: number, usuarioId: number): Promise<Consulta> {
    return assertOwnership(
      this.consultaRepository
        .createQueryBuilder('consulta')
        .innerJoin('consulta.estudio', 'estudio')
        .where('consulta.id = :id', { id })
        .andWhere('estudio.usuario_id = :usuarioId', { usuarioId }),
      'Consulta no encontrada',
    );
  }

  async update(id: number, usuarioId: number, dto: UpdateConsultaDto): Promise<Consulta> {
    const consulta = await this.findOne(id, usuarioId);
    const estadoAnterior = consulta.estado;

    const safe = sanitizeFields(dto, ['tipo_caso']);
    Object.assign(consulta, safe);
    const saved = await this.consultaRepository.save(consulta);

    if (dto.estado && dto.estado !== estadoAnterior) {
      this.actividadService
        .registrar(id, 'estado_cambiado', `Estado cambiado a ${dto.estado}`)
        .catch((err) =>
          this.logger.error(`registrar estado_cambiado: ${err?.message}`, err?.stack),
        );
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
    // Single-pass aggregate query — no N rows into memory.
    const raw = await this.consultaRepository
      .createQueryBuilder('c')
      .innerJoin('c.estudio', 'e')
      .select('c.estado', 'estado')
      .addSelect('COUNT(c.id)', 'count')
      .where('e.usuario_id = :uid', { uid: usuarioId })
      .groupBy('c.estado')
      .getRawMany<{ estado: string; count: string }>();

    const stats = { total: 0, nuevo: 0, en_proceso: 0, cerrado: 0 };
    for (const row of raw) {
      const n = parseInt(row.count, 10);
      stats.total += n;
      if (row.estado === 'nuevo') stats.nuevo = n;
      else if (row.estado === 'en_proceso') stats.en_proceso = n;
      else if (row.estado === 'cerrado') stats.cerrado = n;
    }
    return stats;
  }

  /**
   * Consultas without activity in >=30 days.
   *
   * Raw SQL is used for GROUP BY + derived dias_sin_movimiento. Only `$1` is
   * interpolated, and it carries an integer from the JWT — never user input.
   */
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

  /** Returns true if the given filename belongs to a consulta owned by the user. */
  async userOwnsFile(usuarioId: number, filename: string): Promise<boolean> {
    const count = await this.consultaRepository
      .createQueryBuilder('c')
      .innerJoin('c.estudio', 'e')
      .where('e.usuario_id = :uid', { uid: usuarioId })
      .andWhere('(c.dni_archivo = :f OR c.docs_archivo = :f)', { f: filename })
      .getCount();
    return count > 0;
  }
}
