import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImpresoraSimuladaAdapter } from './impresora-simulada.adapter.js';

describe('ImpresoraSimuladaAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loguea el trabajo de impresión en vez de mandarlo a una impresora real', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const adapter = new ImpresoraSimuladaAdapter();

    await adapter.imprimir({
      comprobanteId: 'comp-1',
      tipo: 'ticket_venta',
      contenido: 'Memoria RAM 16GB x1 ... $150.000',
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const mensaje = logSpy.mock.calls[0][0] as string;
    expect(mensaje).toContain('comp-1');
    expect(mensaje).toContain('ticket_venta');
    expect(mensaje).toContain('Memoria RAM 16GB x1 ... $150.000');
  });

  it('resuelve la promesa sin lanzar (nunca bloquea la confirmación de venta)', async () => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const adapter = new ImpresoraSimuladaAdapter();

    await expect(
      adapter.imprimir({ comprobanteId: 'comp-2', tipo: 'presupuesto', contenido: '' }),
    ).resolves.toBeUndefined();
  });
});
