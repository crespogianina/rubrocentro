import { Logger, type CallHandler, type ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoggingInterceptor } from './logging.interceptor.js';

function crearContexto(): { context: ExecutionContext; request: { method: string; originalUrl: string } } {
  const request = { method: 'POST', originalUrl: '/api/v1/stock/ajustes' };
  const response = { statusCode: 201 };
  const context = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('LoggingInterceptor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loguea método, URL, status code y duración cuando el handler resuelve bien', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const interceptor = new LoggingInterceptor();
    const { context } = crearContexto();
    const callHandler: CallHandler = { handle: () => of({ ok: true }) };

    const resultado = await firstValueFrom(interceptor.intercept(context, callHandler));

    expect(resultado).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const mensaje = logSpy.mock.calls[0][0] as string;
    expect(mensaje).toContain('POST');
    expect(mensaje).toContain('/api/v1/stock/ajustes');
    expect(mensaje).toContain('201');
  });

  it('loguea como warning cuando el handler rechaza, sin ocultar el error', async () => {
    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const interceptor = new LoggingInterceptor();
    const { context } = crearContexto();
    const callHandler: CallHandler = { handle: () => throwError(() => new Error('Stock insuficiente.')) };

    await expect(firstValueFrom(interceptor.intercept(context, callHandler))).rejects.toThrow(
      'Stock insuficiente.',
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const mensaje = warnSpy.mock.calls[0][0] as string;
    expect(mensaje).toContain('ERROR');
    expect(mensaje).toContain('Stock insuficiente.');
  });
});
