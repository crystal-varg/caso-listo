import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { HonorariosService } from './honorarios.service';
import { CreateHonorarioDto, UpdateHonorarioDto } from './honorario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('honorarios')
@UseGuards(JwtAuthGuard)
export class HonorariosController {
  constructor(private readonly honorariosService: HonorariosService) {}

  @Get()
  findAll(@Request() req) {
    return this.honorariosService.findByUsuario(req.user.id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateHonorarioDto) {
    return this.honorariosService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateHonorarioDto,
  ) {
    return this.honorariosService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(
    @Request() req,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    return this.honorariosService.remove(id, req.user.id);
  }
}
