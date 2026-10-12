import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const parsed = this.parse(exception);
    if (parsed.status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(parsed.status).json({
      success: false,
      statusCode: parsed.status,
      message: parsed.message,
      errors: parsed.errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private parse(exception: unknown): { status: number; message: string; errors?: string[] } {
    const code = typeof exception === 'object' && exception ? (exception as { code?: string }).code : undefined;
    if (code === 'LIMIT_FILE_SIZE') {
      return { status: HttpStatus.BAD_REQUEST, message: 'La imagen no puede superar 2 MB' };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') return { status, message: body };
      if (typeof body === 'object' && body) {
        const message = (body as { message?: string | string[] }).message;
        if (Array.isArray(message)) {
          return { status, message: 'Datos inválidos', errors: message };
        }
        if (typeof message === 'string') return { status, message };
      }
      return { status, message: exception.message };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error interno del servidor' };
  }
}
