import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    return next.handle().pipe(
      map((payload: unknown) => {
        if (this.isPage(payload)) {
          return { success: true, data: payload.items, meta: payload.meta };
        }
        return { success: true, data: payload };
      }),
    );
  }

  private isPage(payload: unknown): payload is { items: unknown; meta: unknown } {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'items' in payload &&
      'meta' in payload
    );
  }
}
