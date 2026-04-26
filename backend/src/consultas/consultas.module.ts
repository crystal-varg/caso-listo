import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consulta } from './consulta.entity';
import { ConsultasController } from './consultas.controller';
import { ConsultasService } from './consultas.service';
import { ConsultaScoreService } from './consulta-score.service';
import { MailModule } from '../mail/mail.module';
import { EstudiosModule } from '../estudios/estudios.module';
import { ActividadModule } from '../actividad/actividad.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consulta]), MailModule, EstudiosModule, ActividadModule, NotificacionesModule],
  controllers: [ConsultasController],
  providers: [ConsultasService, ConsultaScoreService],
  exports: [ConsultasService, ConsultaScoreService],
})
export class ConsultasModule {}
