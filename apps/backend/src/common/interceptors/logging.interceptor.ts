import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

// Último eslabón del flujo de una request (docs/ARQUITECTURA.md, "Flujo de
// una request"): loguea método, URL, status y duración de cada request.
// El status real de un error lo decide DomainExceptionFilter (evitamos
// duplicar esa lógica acá) — en el camino de error solo logueamos que
// falló y con qué mensaje.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logExito(request, response.statusCode, inicio),
        error: (error: unknown) => this.logError(request, error, inicio),
      }),
    );
  }

  private logExito(request: Request, status: number, inicio: number): void {
    this.logger.log(`${request.method} ${request.originalUrl} ${status} +${Date.now() - inicio}ms`);
  }

  private logError(request: Request, error: unknown, inicio: number): void {
    const mensaje = error instanceof Error ? error.message : 'error desconocido';
    this.logger.warn(
      `${request.method} ${request.originalUrl} ERROR (${mensaje}) +${Date.now() - inicio}ms`,
    );
  }
}
