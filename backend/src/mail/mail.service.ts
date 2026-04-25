import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { Usuario } from '../users/usuario.entity';
import { Consulta } from '../consultas/consulta.entity';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://casolisto.online';

/**
 * Escape every string interpolated into the outbound HTML. Client-submitted
 * fields flow straight into the lawyer's inbox — one unescaped `<img>` and
 * we hand an XSS payload to their mail client.
 */
function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseHtml = (contenido: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .logo { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }
      .logo span { color: #4f46e5; }
      h2 { margin: 0 0 20px; color: #1a1a2e; font-size: 22px; }
      .campo { margin-bottom: 16px; }
      .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
      .valor { font-size: 15px; color: #1a1a2e; }
      .mensaje { background: #f8f8ff; border-left: 3px solid #4f46e5; padding: 14px 16px; border-radius: 4px; font-size: 14px; color: #333; line-height: 1.6; }
      .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; }
      .footer { margin-top: 28px; font-size: 12px; color: #aaa; text-align: center; }
      .raw-link { word-break: break-all; font-size: 12px; color: #6b7280; margin-top: 16px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="logo">Caso<span>Listo</span></div>
      ${contenido}
      <div class="footer">Caso Listo · Sistema de gestión para estudios jurídicos</div>
    </div>
  </body>
  </html>
`;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no configurada — los emails se omitirán silenciosamente.');
    } else if (!process.env.MAIL_FROM) {
      this.logger.warn('MAIL_FROM no configurada — los emails se omitirán silenciosamente.');
    }
  }

  /**
   * Generic send. Errors are logged, not thrown — every caller in this codebase
   * uses fire-and-forget semantics for email, and a transport failure must not
   * roll back the application transaction that triggered it.
   */
  async sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
    const from = process.env.MAIL_FROM;
    if (!this.resend || !from) {
      this.logger.log(`[MAIL SIMULADO] Para: ${opts.to} | Asunto: ${opts.subject}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (error) {
        this.logger.error(`Resend error: ${error.message ?? JSON.stringify(error)}`);
      }
    } catch (err: any) {
      this.logger.error(`Resend send failed: ${err?.message}`, err?.stack);
    }
  }

  async notificarNuevaConsulta(abogado: Usuario, consulta: Consulta): Promise<void> {
    const urgenciaEmoji = { alta: '🔴', media: '🟡', baja: '🟢' }[consulta.urgencia] || '⚪';

    const html = baseHtml(`
      <h2>Nueva consulta recibida</h2>
      <div class="campo">
        <div class="label">Cliente</div>
        <div class="valor">${escapeHtml(consulta.nombre_cliente)}</div>
      </div>
      <div class="campo">
        <div class="label">Contacto</div>
        <div class="valor">${escapeHtml(consulta.email)}${consulta.telefono ? ` · ${escapeHtml(consulta.telefono)}` : ''}</div>
      </div>
      ${consulta.urgencia ? `
      <div class="campo">
        <div class="label">Urgencia</div>
        <div class="valor">${urgenciaEmoji} ${escapeHtml(consulta.urgencia.charAt(0).toUpperCase() + consulta.urgencia.slice(1))}</div>
      </div>` : ''}
      <div class="campo">
        <div class="label">Mensaje</div>
        <div class="mensaje">${escapeHtml(consulta.mensaje)}</div>
      </div>
      <a href="${FRONTEND_URL}/dashboard" class="btn">Ver en el panel →</a>
    `);

    await this.sendMail({
      to: abogado.email,
      subject: `${urgenciaEmoji} Nueva consulta de ${(consulta.nombre_cliente || '').replace(/[\r\n]/g, ' ').slice(0, 80)}`,
      html,
    });
  }

  async notificarEventoProximo(
    to: string,
    tituloEvento: string,
    tipoEvento: string,
    caso: string,
  ): Promise<void> {
    const html = baseHtml(`
      <h2>Recordatorio de agenda</h2>
      <p style="font-size:15px;color:#374151;">
        Tenés <strong>${escapeHtml(tituloEvento)}</strong> próximamente para el caso de <strong>${escapeHtml(caso)}</strong>.
      </p>
      <a href="${FRONTEND_URL}/dashboard/agenda" class="btn">Ver agenda →</a>
    `);

    await this.sendMail({
      to,
      subject: `📅 Recordatorio: ${(tipoEvento || '').replace(/[\r\n]/g, ' ')} — ${(caso || '').replace(/[\r\n]/g, ' ').slice(0, 80)}`,
      html,
    });
  }

  async notificarCasoInactivo(
    to: string,
    nombreCliente: string,
    caso: string,
    dias: number,
  ): Promise<void> {
    const html = baseHtml(`
      <h2>Caso sin movimiento</h2>
      <p style="font-size:15px;color:#374151;">
        El caso de <strong>${escapeHtml(nombreCliente)}</strong> (${escapeHtml(caso)}) lleva <strong>${dias} días</strong> sin actividad registrada.
      </p>
      <p style="font-size:14px;color:#6b7280;">
        Ingresá al panel para registrar novedades o retomar el contacto con el cliente.
      </p>
      <a href="${FRONTEND_URL}/dashboard/consultas" class="btn">Ver casos →</a>
    `);

    await this.sendMail({
      to,
      subject: `⚠️ Seguimiento: ${(caso || '').replace(/[\r\n]/g, ' ').slice(0, 80)} lleva ${dias} días sin movimiento`,
      html,
    });
  }

  /**
   * Password reset email. The URL is built upstream — this service trusts it
   * to be a https://casolisto.online/reset-password?token=… link with a 64-char
   * hex token that survived our own validation. We escape it on output anyway.
   */
  async notificarPasswordReset(to: string, resetUrl: string): Promise<void> {
    const html = baseHtml(`
      <h2>Restablecé tu contraseña</h2>
      <p style="font-size:15px;color:#374151;">
        Recibimos una solicitud para restablecer tu contraseña en CasoListo.
        Hacé clic en el botón para elegir una nueva. El enlace expira en 1 hora.
      </p>
      <a href="${escapeHtml(resetUrl)}" class="btn">Restablecer contraseña →</a>
      <p class="raw-link">Si el botón no funciona, copiá este enlace en tu navegador:<br>${escapeHtml(resetUrl)}</p>
      <p style="font-size:13px;color:#9ca3af;margin-top:20px;">
        Si no solicitaste este cambio, ignorá este email — tu contraseña actual seguirá funcionando.
      </p>
    `);

    await this.sendMail({
      to,
      subject: 'Restablecé tu contraseña en CasoListo',
      html,
    });
  }
}
