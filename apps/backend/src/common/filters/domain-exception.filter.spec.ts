import { BadRequestException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from './domain-exception.filter.js';
import { ProductoInvalidoError } from '../../catalogo/domain/producto.entity.js';
import { CredencialesInvalidasError } from '../../identidad/domain/usuario.entity.js';
import { CotizacionNoDisponibleError } from '../../cotizaciones/domain/cotizacion.entity.js';

function crearHostFalso() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url: '/api/v1/productos' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it('mapea un error de dominio "invalido" a 400 con el mensaje original', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = crearHostFalso();

    filtro.catch(new ProductoInvalidoError('El producto necesita un nombre.'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El producto necesita un nombre.',
        path: '/api/v1/productos',
      }),
    );
  });

  it('mapea CredencialesInvalidasError a 401', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = crearHostFalso();

    filtro.catch(new CredencialesInvalidasError('Usuario o contraseña incorrectos.'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Usuario o contraseña incorrectos.' }),
    );
  });

  it('mapea CotizacionNoDisponibleError a 503 (fuente externa caída, no error del cliente)', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status } = crearHostFalso();

    filtro.catch(new CotizacionNoDisponibleError('sin cotización cacheada'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('deja pasar una HttpException de Nest tal cual (Guards, ValidationPipe, etc.)', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = crearHostFalso();

    filtro.catch(new BadRequestException(['el campo nombre es requerido']), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['el campo nombre es requerido'] }),
    );
  });

  it('un error no mapeado cae a 500 sin exponer el mensaje interno', () => {
    const filtro = new DomainExceptionFilter();
    const { host, status, json } = crearHostFalso();

    filtro.catch(new Error('detalle interno sensible de Prisma'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const cuerpo = json.mock.calls[0][0] as { message: string };
    expect(cuerpo.message).toBe('Error interno del servidor.');
    expect(cuerpo.message).not.toContain('Prisma');
  });
});
