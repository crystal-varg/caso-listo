import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Honorario } from './honorario.entity';
import { Consulta } from '../consultas/consulta.entity';
import { HonorariosController } from './honorarios.controller';
import { HonorariosService } from './honorarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Honorario, Consulta])],
  controllers: [HonorariosController],
  providers: [HonorariosService],
})
export class HonorariosModule {}
