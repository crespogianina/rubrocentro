import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProductoInvalidoError } from '../../catalogo/domain/producto.entity.js';
import { VarianteInvalidaError } from '../../catalogo/domain/variante.entity.js';
import { MovimientoInvalidoError } from '../../stock/domain/movimiento.entity.js';
import { CredencialesInvalidasError } from '../../identidad/domain/usuario.entity.js';
import { CotizacionInvalidaError, CotizacionNoDisponibleError } from '../../cotizaciones/domain/cotizacion.entity.js';
import { TipoCotizacionInactivoError } from '../../cotizaciones/domain/tipo-cotizacion.entity.js';

// Último eslabón del flujo de una request (ver docs/ARQUITECTURA.md,
// "Flujo de una request"): traduce las excepciones de dominio (clases
// planas que extienden `Error`, sin conocer HTTP — regla de dependencias
// de CLAUDE.md) a una respuesta HTTP consistente. Es la ÚNICA pieza que
// conoce a la vez el vocabulario de errores de cada módulo y el de Nest;
// nada en `domain/`, `application/` ni `infrastructure/` depende de esto.
//
// Agregar acá cada nuevo tipo de error de dominio que se sume en otro
// módulo — si no está mapeado, cae al 500 genérico de abajo (nunca revienta
// sin responder, pero tampoco da el código HTTP correcto).
const ERRORES_A_BAD_REQUEST = [
  ProductoInvalidoError,
  VarianteInvalidaError,
  MovimientoInvalidoError,
  CotizacionInvalidaError,
  TipoCotizacionInactivoError,
];

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      // Ya es una respuesta HTTP bien formada (ValidationPipe, Guards,
      // NotFoundException manual, etc.) — la dejamos pasar tal cual.
      const status = exception.getStatus();
      const cuerpo = exception.getResponse();
      response
        .status(status)
        .json(typeof cuerpo === 'string' ? { statusCode: status, message: cuerpo } : cuerpo);
      return;
    }

    const status = this.resolverStatus(exception);
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      // No exponemos el mensaje real de un error no mapeado (puede traer
      // detalle de Prisma u otro interno) — pero sí lo logueamos entero.
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      message: this.resolverMensaje(exception, status),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolverStatus(exception: unknown): number {
    if (exception instanceof CredencialesInvalidasError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (exception instanceof CotizacionNoDisponibleError) {
      // Las dos fuentes externas de cotización fallaron y no hay nada
      // cacheado — es la fuente externa la que no está disponible, no un
      // error del cliente.
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    if (ERRORES_A_BAD_REQUEST.some((ErrorDeDominio) => exception instanceof ErrorDeDominio)) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolverMensaje(exception: unknown, status: number): string {
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Error interno del servidor.';
    }
    return exception instanceof Error ? exception.message : 'Error desconocido.';
  }
}
