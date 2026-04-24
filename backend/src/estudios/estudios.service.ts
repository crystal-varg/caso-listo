import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estudio } from './estudio.entity';

@Injectable()
export class EstudiosService {
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
    return this.estudioRepository.findOne({
      where: { usuario_id: usuarioId },
    });
  }

  async create(usuarioId: number, nombreEstudio: string): Promise<Estudio> {
    const slug = this.generarSlug(nombreEstudio);
    const estudio = this.estudioRepository.create({
      nombre_estudio: nombreEstudio,
      usuario_id: usuarioId,
      slug,
    });
    return this.estudioRepository.save(estudio);
  }

  async updateByUsuario(usuarioId: number, nombreEstudio: string): Promise<Estudio> {
    const estudio = await this.findByUsuario(usuarioId);
    estudio.nombre_estudio = nombreEstudio;
    return this.estudioRepository.save(estudio);
  }

  private generarSlug(nombre: string): string {
    const base = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const random = Math.random().toString(36).substring(2, 7);
    return `${base}-${random}`;
  }
}
