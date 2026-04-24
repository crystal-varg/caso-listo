import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Estudio } from './estudio.entity';
import { generateSlug, SLUG_BLOCKLIST } from '../common/utils/slug';
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

  async updateByUsuario(usuarioId: number, nombreEstudio: string): Promise<Estudio> {
    const estudio = await this.findByUsuario(usuarioId);
    if (!estudio) throw new InternalServerErrorException('Estudio no encontrado');
    estudio.nombre_estudio = sanitizeText(nombreEstudio);
    return this.estudioRepository.save(estudio);
  }

  private isUniqueViolation(err: QueryFailedError): boolean {
    const driverErr = (err as any).driverError ?? err;
    // PostgreSQL unique violation SQLSTATE.
    return driverErr?.code === '23505';
  }
}
