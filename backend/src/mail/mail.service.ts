import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Usuario } from '../users/usuario.entity';
import { Consulta } from '../consultas/consulta.entity';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async notificarNuevaConsulta(abogado: Usuario, consulta: Consulta): Promise<void> {
    if (!process.env.SMTP_USER) {
      console.log('📧 [MAIL SIMULADO] Nueva consulta para:', abogado.email);
      return;
    }

    const urgenciaEmoji = {
      alta: '🔴',
      media: '🟡',
      baja: '🟢',
    }[consulta.urgencia] || '⚪';

    await this.transporter.sendMail({
      from: `"Caso Listo" <${process.env.SMTP_USER}>`,
      to: abogado.email,
      subject: `${urgenciaEmoji} Nueva consulta de ${consulta.nombre_cliente}`,
      html: `
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
            .urgencia { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .urgencia.alta { background: #fee2e2; color: #dc2626; }
            .urgencia.media { background: #fef3c7; color: #d97706; }
            .urgencia.baja { background: #d1fae5; color: #059669; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">Caso<span>Listo</span></div>
            <h2>Nueva consulta recibida</h2>

            <div class="campo">
              <div class="label">Cliente</div>
              <div class="valor">${consulta.nombre_cliente}</div>
            </div>

            <div class="campo">
              <div class="label">Contacto</div>
              <div class="valor">${consulta.email}${consulta.telefono ? ` · ${consulta.telefono}` : ''}</div>
            </div>

            ${consulta.urgencia ? `
            <div class="campo">
              <div class="label">Urgencia</div>
              <span class="urgencia ${consulta.urgencia}">${urgenciaEmoji} ${consulta.urgencia.charAt(0).toUpperCase() + consulta.urgencia.slice(1)}</span>
            </div>` : ''}

            <div class="campo">
              <div class="label">Mensaje</div>
              <div class="mensaje">${consulta.mensaje}</div>
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
              Ver en el panel →
            </a>

            <div class="footer">Caso Listo · Sistema de gestión de consultas para abogados</div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
