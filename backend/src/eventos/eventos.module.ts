import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './evento.entity';
import { Consulta } from '../consultas/consulta.entity';
import { ActividadModule } from '../actividad/actividad.module';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evento, Consulta]), ActividadModule],
  controllers: [EventosController],
  providers: [EventosService],
})
export class EventosModule {}
