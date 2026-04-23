import { Controller, Get, Patch, Post, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';
import { NotificationRulesService } from './notification-rules.service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly rulesService: NotificationRulesService,
  ) {}

  @Get()
  getAll(@Request() req) {
    return this.notificacionesService.getByUsuario(req.user.id);
  }

  // Must be declared before :id routes to avoid param collision
  @Post('evaluar')
  evaluar(@Request() req) {
    return this.rulesService.evaluarTodo(req.user.id);
  }

  @Patch('leer-todas')
  marcarTodas(@Request() req) {
    return this.notificacionesService.marcarTodosLeidos(req.user.id);
  }

  @Patch(':id/leer')
  marcarLeida(@Request() req, @Param('id') id: string) {
    return this.notificacionesService.marcarLeido(+id, req.user.id);
  }
}
