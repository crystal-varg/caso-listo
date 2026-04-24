import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './notificacion.entity';
import { sanitizeText } from '../common/utils/sanitize';
import { safeWaLink } from '../common/utils/whatsapp';

interface CrearDto {
  usuario_id: number;
  consulta_id?: number | null;
  tipo: string;
  canal: string;
  titulo: string;
  mensaje: string;
  referencia_id?: number | null;
  referencia_tipo?: string | null;
  wa_link?: string | null;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private repo: Repository<Notificacion>,
  ) {}

  async crear(dto: CrearDto): Promise<Notificacion> {
    const n = this.repo.create({
      usuario_id: dto.usuario_id,
      consulta_id: dto.consulta_id ?? null,
      tipo: dto.tipo,
      canal: dto.canal,
      titulo: sanitizeText(dto.titulo),
      mensaje: sanitizeText(dto.mensaje),
      referencia_id: dto.referencia_id ?? null,
      referencia_tipo: dto.referencia_tipo ?? null,
      // Silently drop malformed WhatsApp URLs — never persist an untrusted link
      // that the UI will later render as clickable.
      wa_link: safeWaLink(dto.wa_link),
    });
    return this.repo.save(n);
  }

  async getByUsuario(usuarioId: number): Promise<Notificacion[]> {
    return this.repo.find({
      where: { usuario_id: usuarioId, canal: 'in_app' },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async marcarLeido(id: number, usuarioId: number): Promise<void> {
    await this.repo.update({ id, usuario_id: usuarioId }, { leido: true });
  }

  async marcarTodosLeidos(usuarioId: number): Promise<void> {
    await this.repo.update({ usuario_id: usuarioId, leido: false }, { leido: true });
  }

  async existe(
    usuarioId: number,
    tipo: string,
    opts: { consultaId?: number; referenciaId?: number; ventanaDias: number },
  ): Promise<boolean> {
    const since = new Date();
    since.setDate(since.getDate() - opts.ventanaDias);

    const query = this.repo
      .createQueryBuilder('n')
      .where('n.usuario_id = :uid AND n.tipo = :tipo AND n.created_at > :since', {
        uid: usuarioId, tipo, since,
      });

    if (opts.consultaId !== undefined) {
      query.andWhere('n.consulta_id = :cid', { cid: opts.consultaId });
    }
    if (opts.referenciaId !== undefined) {
      query.andWhere('n.referencia_id = :rid', { rid: opts.referenciaId });
    }

    return (await query.getCount()) > 0;
  }
}
