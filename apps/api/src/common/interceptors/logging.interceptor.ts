import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { RequestUser } from '../types/request-user';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = randomUUID();
    response.setHeader('X-Request-Id', requestId);
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(request, response.statusCode, started, requestId),
        error: () => this.write(request, response.statusCode || 500, started, requestId),
      }),
    );
  }

  private write(request: Request & { user?: RequestUser }, statusCode: number, started: number, requestId: string) {
    this.logger.log(
      JSON.stringify({
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        durationMs: Date.now() - started,
        userId: request.user?.id ?? null,
      }),
    );
  }
}
