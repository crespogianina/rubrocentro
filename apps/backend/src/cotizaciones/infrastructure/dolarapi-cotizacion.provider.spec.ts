import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DolarApiCotizacionProvider } from './dolarapi-cotizacion.provider.js';
import type { ConfigService } from '@nestjs/config';

function respuestaOk(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function respuestaError(status: number): Response {
  return new Response(null, { status });
}

function crearConfigServiceFalso(): ConfigService {
  return { get: vi.fn().mockReturnValue('https://dolarapi.com/v1') } as unknown as ConfigService;
}

describe('DolarApiCotizacionProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta DolarAPI y devuelve el valor de venta', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      respuestaOk({ casa: 'oficial', nombre: 'Oficial', compra: 1480, venta: 1530, moneda: 'ARS' }),
    );
    const provider = new DolarApiCotizacionProvider(crearConfigServiceFalso());

    const resultado = await provider.obtenerValorActual('oficial');

    expect(resultado).toEqual({ valor: 1530, fuente: 'dolarapi.com' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://dolarapi.com/v1/dolares/oficial');
  });

  it('traduce el tipo de cotización a la "casa" que espera la URL (mep -> bolsa, ccl -> contadoconliqui)', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(respuestaOk({ venta: 1200 })));
    const provider = new DolarApiCotizacionProvider(crearConfigServiceFalso());

    await provider.obtenerValorActual('mep');
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://dolarapi.com/v1/dolares/bolsa');

    await provider.obtenerValorActual('ccl');
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://dolarapi.com/v1/dolares/contadoconliqui');
  });

  it('si DolarAPI falla, cae a ArgentinaDatos y toma el último valor de la serie', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respuestaError(503))
      .mockResolvedValueOnce(
        respuestaOk([
          { casa: 'blue', compra: 1400, venta: 1450, fecha: '2026-09-10' },
          { casa: 'blue', compra: 1410, venta: 1460, fecha: '2026-09-11' },
        ]),
      );
    const provider = new DolarApiCotizacionProvider(crearConfigServiceFalso());

    const resultado = await provider.obtenerValorActual('blue');

    expect(resultado).toEqual({ valor: 1460, fuente: 'argentinadatos.com' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe(
      'https://api.argentinadatos.com/v1/cotizaciones/dolares/blue',
    );
  });

  it('si DolarAPI y ArgentinaDatos fallan, rechaza', async () => {
    vi.mocked(fetch).mockResolvedValue(respuestaError(500));
    const provider = new DolarApiCotizacionProvider(crearConfigServiceFalso());

    await expect(provider.obtenerValorActual('oficial')).rejects.toThrow();
  });

  it('rechaza un tipo de cotización sin mapeo de casa conocido, sin llamar a fetch', async () => {
    const provider = new DolarApiCotizacionProvider(crearConfigServiceFalso());

    await expect(provider.obtenerValorActual('cripto-random')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
