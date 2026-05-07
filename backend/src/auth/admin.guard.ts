import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Authorizes admin-only routes. Must be combined with `JwtAuthGuard` upstream
 * (e.g. `@UseGuards(JwtAuthGuard, AdminGuard)`) so that `request.user` is
 * populated by the JWT strategy before this guard runs.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return !!user && user.role === 'admin';
  }
}
