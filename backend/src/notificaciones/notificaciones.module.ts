import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './notificacion.entity';
import { Evento } from '../eventos/evento.entity';
import { Honorario } from '../honorarios/honorario.entity';
import { Consulta } from '../consultas/consulta.entity';
import { MailModule } from '../mail/mail.module';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificationRulesService } from './notification-rules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion, Evento, Honorario, Consulta]),
    MailModule,
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, NotificationRulesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
