import { describe, expect, it, vi } from 'vitest';
import { ObtenerCotizacionVigenteUseCase } from './obtener-cotizacion-vigente.use-case.js';
import { Cotizacion } from '../../domain/cotizacion.entity.js';
import { TipoCotizacion } from '../../domain/tipo-cotizacion.entity.js';
import { CotizacionProvider } from '../ports/cotizacion-provider.port.js';
import { CotizacionRepository } from '../ports/cotizacion-repository.port.js';

const TIPO_OFICIAL = TipoCotizacion.reconstruir({
  id: 'tipo-oficial',
  nombre: 'oficial',
  fuente: 'dolarapi.com',
  activo: true,
});

function crearProviderFalso(overrides: Partial<CotizacionProvider> = {}): CotizacionProvider {
  return {
    obtenerValorActual: vi.fn().mockResolvedValue({ valor: 1000, fuente: 'dolarapi.com' }),
    ...overrides,
  };
}

function crearRepositorioFalso(overrides: Partial<CotizacionRepository> = {}): CotizacionRepository {
  return {
    buscarTipoPorId: vi.fn().mockResolvedValue(TIPO_OFICIAL),
    buscarUltimaCotizacion: vi.fn().mockResolvedValue(null),
    guardarCotizacion: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ObtenerCotizacionVigenteUseCase', () => {
  it('consulta la fuente externa, cachea el resultado y lo devuelve', async () => {
    const provider = crearProviderFalso();
    const repositorio = crearRepositorioFalso();
    const useCase = new ObtenerCotizacionVigenteUseCase(provider, repositorio);

    const resultado = await useCase.ejecutar({ tipoCotizacionId: 'tipo-oficial' });

    expect(resultado.valor).toBe(1000);
    expect(resultado.desdeCache).toBe(false);
    expect(provider.obtenerValorActual).toHaveBeenCalledWith('oficial');
    expect(repositorio.guardarCotizacion).toHaveBeenCalledTimes(1);
  });

  it('si la fuente externa falla, devuelve la última cotización cacheada', async () => {
    const provider = crearProviderFalso({
      obtenerValorActual: vi.fn().mockRejectedValue(new Error('timeout de red')),
    });
    const cotizacionCacheada = Cotizacion.crear({
      id: 'hist-1',
      tipoCotizacionId: 'tipo-oficial',
      valor: 950,
      fechaHora: new Date('2026-09-10T12:00:00Z'),
      fuente: 'dolarapi.com',
    });
    const repositorio = crearRepositorioFalso({
      buscarUltimaCotizacion: vi.fn().mockResolvedValue(cotizacionCacheada),
    });
    const useCase = new ObtenerCotizacionVigenteUseCase(provider, repositorio);

    const resultado = await useCase.ejecutar({ tipoCotizacionId: 'tipo-oficial' });

    expect(resultado.valor).toBe(950);
    expect(resultado.desdeCache).toBe(true);
    expect(repositorio.guardarCotizacion).not.toHaveBeenCalled();
  });

  it('si la fuente externa falla y no hay nada cacheado, rechaza', async () => {
    const provider = crearProviderFalso({
      obtenerValorActual: vi.fn().mockRejectedValue(new Error('timeout de red')),
    });
    const repositorio = crearRepositorioFalso({
      buscarUltimaCotizacion: vi.fn().mockResolvedValue(null),
    });
    const useCase = new ObtenerCotizacionVigenteUseCase(provider, repositorio);

    await expect(useCase.ejecutar({ tipoCotizacionId: 'tipo-oficial' })).rejects.toThrow();
  });

  it('rechaza si el tipo de cotización no existe', async () => {
    const provider = crearProviderFalso();
    const repositorio = crearRepositorioFalso({
      buscarTipoPorId: vi.fn().mockResolvedValue(null),
    });
    const useCase = new ObtenerCotizacionVigenteUseCase(provider, repositorio);

    await expect(useCase.ejecutar({ tipoCotizacionId: 'no-existe' })).rejects.toThrow();
    expect(provider.obtenerValorActual).not.toHaveBeenCalled();
  });

  it('rechaza si el tipo de cotización está inactivo', async () => {
    const provider = crearProviderFalso();
    const repositorio = crearRepositorioFalso({
      buscarTipoPorId: vi.fn().mockResolvedValue(
        TipoCotizacion.reconstruir({ ...TIPO_OFICIAL.toProps(), activo: false }),
      ),
    });
    const useCase = new ObtenerCotizacionVigenteUseCase(provider, repositorio);

    await expect(useCase.ejecutar({ tipoCotizacionId: 'tipo-oficial' })).rejects.toThrow();
  });
});
