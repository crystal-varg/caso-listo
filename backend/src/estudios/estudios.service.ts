import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Estudio, EstudioConfig } from './estudio.entity';
import {
  generateSlug,
  isValidSlugFormat,
  SLUG_BLOCKLIST,
} from '../common/utils/slug';
import { sanitizeText } from '../common/utils/sanitize';

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class EstudiosService {
  private readonly logger = new Logger(EstudiosService.name);

  constructor(
    @InjectRepository(Estudio)
    private estudioRepository: Repository<Estudio>,
  ) {}

  async findBySlug(slug: string): Promise<Estudio | null> {
    return this.estudioRepository.findOne({
      where: { slug },
      relations: ['usuario'],
    });
  }

  /**
   * Public landing-page lookup. Selects only the fields safe to expose without
   * authentication — does NOT load the `usuario` relation, which carries the
   * password hash and other sensitive identity data.
   */
  async findPublicBySlug(
    slug: string,
  ): Promise<Pick<Estudio, 'nombre_estudio' | 'slug' | 'config'> | null> {
    return this.estudioRepository.findOne({
      where: { slug },
      select: ['nombre_estudio', 'slug', 'config'],
    });
  }

  async findByUsuario(usuarioId: number): Promise<Estudio | null> {
    return this.estudioRepository.findOne({ where: { usuario_id: usuarioId } });
  }

  /**
   * Create an estudio with a collision-resistant slug. Retries up to
   * MAX_SLUG_ATTEMPTS times on unique-violation before raising 500 — at 64 bits
   * of entropy, five collisions in a row is astronomically unlikely and signals
   * a real problem (e.g., a broken randomness source).
   */
  async create(usuarioId: number, nombreEstudio: string): Promise<Estudio> {
    const safeName = sanitizeText(nombreEstudio);

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = generateSlug(safeName);
      // Extra defence: never persist a blocklisted slug even if generator is buggy.
      if (SLUG_BLOCKLIST.has(slug)) continue;

      try {
        const estudio = this.estudioRepository.create({
          nombre_estudio: safeName,
          usuario_id: usuarioId,
          slug,
        });
        return await this.estudioRepository.save(estudio);
      } catch (err) {
        if (err instanceof QueryFailedError && this.isUniqueViolation(err)) {
          this.logger.warn(`Slug collision on attempt ${attempt + 1}: ${slug}`);
          continue;
        }
        throw err;
      }
    }

    throw new InternalServerErrorException(
      'No se pudo generar un slug único. Intentá nuevamente.',
    );
  }

  async updateByUsuario(
    usuarioId: number,
    nombreEstudio: string,
    config?: EstudioConfig,
  ): Promise<Estudio> {
    const estudio = await this.findByUsuario(usuarioId);
    if (!estudio) throw new InternalServerErrorException('Estudio no encontrado');
    estudio.nombre_estudio = sanitizeText(nombreEstudio);
    if (config !== undefined) estudio.config = config;
    return this.estudioRepository.save(estudio);
  }

  /**
   * List all estudios with their owner (id/nombre/email). Used by the admin
   * console — never expose this on a public endpoint, the joined `usuario`
   * relation carries identity data.
   */
  async findAllForAdmin(): Promise<Estudio[]> {
    return this.estudioRepository.find({
      relations: ['usuario'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Create an estudio with an admin-supplied slug (no auto-generation). Validates
   * format + blocklist before insert, and translates a unique-violation into a
   * clean 409 — admins should see "slug en uso", not a SQL stack trace.
   */
  async createWithSlug(
    usuarioId: number,
    nombreEstudio: string,
    slug: string,
    config?: EstudioConfig,
  ): Promise<Estudio> {
    if (!isValidSlugFormat(slug)) {
      throw new ConflictException('Slug con formato inválido o reservado.');
    }
    if (SLUG_BLOCKLIST.has(slug)) {
      throw new ConflictException('Slug reservado.');
    }

    try {
      const estudio = this.estudioRepository.create({
        nombre_estudio: sanitizeText(nombreEstudio),
        usuario_id: usuarioId,
        slug,
        config: config ?? null,
      });
      return await this.estudioRepository.save(estudio);
    } catch (err) {
      if (err instanceof QueryFailedError && this.isUniqueViolation(err)) {
        throw new ConflictException('Ya existe un estudio con ese slug.');
      }
      throw err;
    }
  }

  async updateConfigBySlug(
    slug: string,
    partialConfig: Partial<EstudioConfig>,
  ): Promise<Estudio> {
    const estudio = await this.estudioRepository.findOne({ where: { slug } });
    if (!estudio) throw new NotFoundException('Estudio no encontrado.');
    estudio.config = { ...(estudio.config ?? {}), ...partialConfig } as EstudioConfig;
    return this.estudioRepository.save(estudio);
  }

  /**
   * Delete an estudio by slug and return its `usuario_id` so the caller can
   * remove the owning user. Throws 404 if the slug doesn't match.
   */
  async deleteBySlug(slug: string): Promise<{ usuarioId: number }> {
    const estudio = await this.estudioRepository.findOne({ where: { slug } });
    if (!estudio) throw new NotFoundException('Estudio no encontrado.');
    const usuarioId = estudio.usuario_id;
    await this.estudioRepository.remove(estudio);
    return { usuarioId };
  }

  private isUniqueViolation(err: QueryFailedError): boolean {
    const driverErr = (err as any).driverError ?? err;
    // PostgreSQL unique violation SQLSTATE.
    return driverErr?.code === '23505';
  }
}
