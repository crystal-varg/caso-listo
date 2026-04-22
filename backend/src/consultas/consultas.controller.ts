import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstadoConsulta } from './consulta.entity';

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  // ─── PÚBLICO: Cliente envía consulta ───────────────────────────────────────
  @Post('publica/:slug')
  async createPublica(
    @Param('slug') slug: string,
    @Body() dto: CreateConsultaDto,
  ) {
    const consulta = await this.consultasService.createPublica(slug, dto);
    return {
      ok: true,
      mensaje: 'Tu consulta fue enviada. Te contactaremos a la brevedad.',
      id: consulta.id,
    };
  }

  // ─── PRIVADO: Panel del abogado ────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Request() req,
    @Query('estado') estado?: EstadoConsulta,
    @Query('fuero') fuero?: string,
  ) {
    return this.consultasService.findByUsuario(req.user.id, { estado, fuero });
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@Request() req) {
    return this.consultasService.getStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.consultasService.findOne(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateConsultaDto,
  ) {
    return this.consultasService.update(+id, req.user.id, dto);
  }
}
