import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter.
 *
 * Every uncaught error produces a homogeneous response shape:
 *   { statusCode: number, message: string, timestamp: string }
 *
 * TypeORM errors, stack traces, SQL fragments, and internal paths are never
 * serialized to the client. They are logged server-side via NestJS Logger.
 *
 * In development, the message may include a more descriptive error; in
 * production, 5xx responses always report a generic message.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Ocurrió un error inesperado.';
    let internalDetail: unknown = exception;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object' && 'message' in resp) {
        message = (resp as { message: string | string[] }).message;
      } else {
        message = exception.message;
      }
      internalDetail = resp;
    } else if (exception instanceof Error) {
      message = isProd ? 'Ocurrió un error inesperado.' : exception.message;
      internalDetail = { name: exception.name, message: exception.message, stack: exception.stack };
    }

    // Always log the full detail — including stack — for observability.
    this.logger.error(
      `[${request.method} ${request.url}] ${status} ${JSON.stringify(internalDetail)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
