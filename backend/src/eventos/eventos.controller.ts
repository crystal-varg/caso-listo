import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventosService } from './eventos.service';
import { CreateEventoDto, UpdateEventoDto } from './evento.dto';

@Controller('eventos')
@UseGuards(JwtAuthGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findAll(@Request() req, @Query('consulta_id') consultaId?: string) {
    return this.eventosService.findByUsuario(req.user.id, consultaId ? +consultaId : undefined);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateEventoDto) {
    return this.eventosService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.eventosService.update(+id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.eventosService.remove(+id, req.user.id);
  }
}
