import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from '../eventos/evento.entity';
import { Honorario } from '../honorarios/honorario.entity';
import { Consulta } from '../consultas/consulta.entity';
import { NotificacionesService } from './notificaciones.service';
import { MailService } from '../mail/mail.service';
import { buildWaLink } from '../common/utils/whatsapp';

@Injectable()
export class NotificationRulesService {
  private readonly logger = new Logger(NotificationRulesService.name);

  constructor(
    private notificacionesService: NotificacionesService,
    private mailService: MailService,
    @InjectRepository(Evento)
    private eventoRepo: Repository<Evento>,
    @InjectRepository(Honorario)
    private honorarioRepo: Repository<Honorario>,
    @InjectRepository(Consulta)
    private consultaRepo: Repository<Consulta>,
  ) {}

  async evaluarTodo(usuarioId: number): Promise<{ creadas: number }> {
    const [a, b, c] = await Promise.all([
      this.evaluarEventosProximos(usuarioId),
      this.evaluarCasosInactivos(usuarioId),
      this.evaluarHonorariosVencidos(usuarioId),
    ]);
    return { creadas: a + b + c };
  }

  private async evaluarEventosProximos(usuarioId: number): Promise<number> {
    const ahora = new Date();
    const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const eventos = await this.eventoRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.consulta', 'c')
      .innerJoin('c.estudio', 'est')
      .where('est.usuario_id = :uid', { uid: usuarioId })
      .andWhere('e.completado = false')
      .andWhere('e.fecha BETWEEN :ahora AND :manana', { ahora, manana })
      .getMany();

    let creadas = 0;
    for (const ev of eventos) {
      const ya = await this.notificacionesService.existe(usuarioId, 'evento_proximo', {
        referenciaId: ev.id,
        ventanaDias: 1,
      });
      if (ya) continue;

      const caso = ev.consulta.tipo_caso || ev.consulta.nombre_cliente;
      const titulo = 'Recordatorio de agenda';
      const mensaje = `Tenés ${ev.titulo} mañana para el caso de ${caso}.`;

      await this.notificacionesService.crear({
        usuario_id: usuarioId,
        consulta_id: ev.consulta_id,
        tipo: 'evento_proximo',
        canal: 'in_app',
        titulo,
        mensaje,
        referencia_id: ev.id,
        referencia_tipo: 'evento',
      });
      creadas++;

      await this.mailService
        .notificarEventoProximo(ev.consulta.email, titulo, ev.titulo, caso)
        .catch((err) => this.logger.error(`mail evento_proximo: ${err?.message}`, err?.stack));
    }
    return creadas;
  }

  private async evaluarCasosInactivos(usuarioId: number): Promise<number> {
    const rows: Array<{
      id: number;
      nombre_cliente: string;
      tipo_caso: string | null;
      email: string;
      telefono: string | null;
      dias: number;
    }> = await this.consultaRepo.query(
      `SELECT c.id, c.nombre_cliente, c.tipo_caso, c.email, c.telefono,
        EXTRACT(DAY FROM NOW() - COALESCE(MAX(a.created_at), c.updated_at))::int AS dias
      FROM consultas c
      INNER JOIN estudios e ON e.id = c.estudio_id
      LEFT JOIN actividad a ON a.consulta_id = c.id
      WHERE e.usuario_id = $1 AND c.estado != 'cerrado'
      GROUP BY c.id
      HAVING EXTRACT(DAY FROM NOW() - COALESCE(MAX(a.created_at), c.updated_at)) >= 30
      ORDER BY dias DESC`,
      [usuarioId],
    );

    let creadas = 0;
    for (const row of rows) {
      const ya = await this.notificacionesService.existe(usuarioId, 'caso_sin_movimiento', {
        consultaId: row.id,
        ventanaDias: 28,
      });
      if (ya) continue;

      const caso = row.tipo_caso || row.nombre_cliente;
      const titulo = 'Caso sin movimiento';
      const mensaje = `El caso de ${caso} lleva ${row.dias} días sin actividad.`;

      await this.notificacionesService.crear({
        usuario_id: usuarioId,
        consulta_id: row.id,
        tipo: 'caso_sin_movimiento',
        canal: 'in_app',
        titulo,
        mensaje,
      });
      creadas++;

      await this.mailService
        .notificarCasoInactivo(row.email, row.nombre_cliente, caso, row.dias)
        .catch((err) => this.logger.error(`mail caso_inactivo: ${err?.message}`, err?.stack));

      if (row.dias >= 90 && row.telefono) {
        const waMsg = `Hola ${row.nombre_cliente.split(' ')[0]}, queríamos retomar el contacto sobre tu caso de ${caso}. ¿Podemos coordinar?`;
        const waLink = buildWaLink(row.telefono, waMsg);
        if (waLink) {
          await this.notificacionesService.crear({
            usuario_id: usuarioId,
            consulta_id: row.id,
            tipo: 'caso_sin_movimiento',
            canal: 'whatsapp',
            titulo: 'Contactar por WhatsApp',
            mensaje: `El caso de ${caso} lleva ${row.dias} días. Podés contactar al cliente por WhatsApp.`,
            wa_link: waLink,
          });
        }
      }
    }
    return creadas;
  }

  private async evaluarHonorariosVencidos(usuarioId: number): Promise<number> {
    const hoy = new Date().toISOString().split('T')[0];

    const honorarios = await this.honorarioRepo
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.consulta', 'c')
      .innerJoin('c.estudio', 'est')
      .where('est.usuario_id = :uid', { uid: usuarioId })
      .andWhere('h.monto_pagado < h.monto_total')
      .andWhere('h.fecha_vencimiento < :hoy', { hoy })
      .getMany();

    let creadas = 0;
    for (const h of honorarios) {
      const ya = await this.notificacionesService.existe(usuarioId, 'honorario_vencido', {
        referenciaId: h.id,
        ventanaDias: 7,
      });
      if (ya) continue;

      const cliente = h.consulta.nombre_cliente;
      const caso = h.consulta.tipo_caso || cliente;
      const restante = h.monto_total - h.monto_pagado;
      const waMsg = `Hola ${cliente.split(' ')[0]}, te escribo por el honorario pendiente del caso "${caso}" ($${Math.round(restante).toLocaleString('es-AR')}). Cuando puedas lo coordinamos.`;
      const waLink = buildWaLink(h.consulta.telefono, waMsg);

      await this.notificacionesService.crear({
        usuario_id: usuarioId,
        consulta_id: h.consulta_id,
        tipo: 'honorario_vencido',
        canal: 'in_app',
        titulo: 'Honorario vencido',
        mensaje: `${cliente} tiene un pago pendiente de $${Math.round(restante).toLocaleString('es-AR')} en el caso "${caso}".`,
        referencia_id: h.id,
        referencia_tipo: 'honorario',
        wa_link: waLink,
      });
      creadas++;
    }
    return creadas;
  }
}
