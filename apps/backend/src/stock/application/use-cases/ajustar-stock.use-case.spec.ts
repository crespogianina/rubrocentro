import { describe, expect, it, vi } from 'vitest';
import { AjustarStockUseCase } from './ajustar-stock.use-case.js';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.use-case.js';
import { StockRepository } from '../ports/stock-repository.port.js';

function crearStockRepositorioFalso(stockActual = 5): StockRepository {
  return {
    registrarMovimiento: vi.fn().mockResolvedValue(undefined),
    obtenerStockActual: vi.fn().mockResolvedValue(stockActual),
  };
}

describe('AjustarStockUseCase', () => {
  it('traduce direccion "alta" a tipo ajuste_alta y no consulta stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(0);
    const registrarMovimiento = new RegistrarMovimientoUseCase(stockRepositorio);
    const useCase = new AjustarStockUseCase(registrarMovimiento);

    const movimiento = await useCase.ejecutar({
      varianteId: 'var-1',
      depositoId: 'dep-1',
      cantidad: 10,
      direccion: 'alta',
      motivo: 'Conteo físico encontró más unidades de las registradas',
      usuarioId: 'user-1',
    });

    expect(movimiento.tipo).toBe('ajuste_alta');
    expect(stockRepositorio.obtenerStockActual).not.toHaveBeenCalled();
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledWith(movimiento);
  });

  it('traduce direccion "baja" a tipo ajuste_baja y respeta el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(3);
    const registrarMovimiento = new RegistrarMovimientoUseCase(stockRepositorio);
    const useCase = new AjustarStockUseCase(registrarMovimiento);

    const movimiento = await useCase.ejecutar({
      varianteId: 'var-1',
      depositoId: 'dep-1',
      cantidad: 3,
      direccion: 'baja',
      motivo: 'Rotura detectada en control de stock',
      usuarioId: 'user-1',
    });

    expect(movimiento.tipo).toBe('ajuste_baja');
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledWith(movimiento);
  });

  it('rechaza una baja que supera el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(1);
    const registrarMovimiento = new RegistrarMovimientoUseCase(stockRepositorio);
    const useCase = new AjustarStockUseCase(registrarMovimiento);

    await expect(
      useCase.ejecutar({
        varianteId: 'var-1',
        depositoId: 'dep-1',
        cantidad: 5,
        direccion: 'baja',
        motivo: 'Rotura',
        usuarioId: 'user-1',
      }),
    ).rejects.toThrow();
    expect(stockRepositorio.registrarMovimiento).not.toHaveBeenCalled();
  });

  it('rechaza un ajuste sin motivo', async () => {
    const stockRepositorio = crearStockRepositorioFalso(10);
    const registrarMovimiento = new RegistrarMovimientoUseCase(stockRepositorio);
    const useCase = new AjustarStockUseCase(registrarMovimiento);

    await expect(
      useCase.ejecutar({
        varianteId: 'var-1',
        depositoId: 'dep-1',
        cantidad: 2,
        direccion: 'alta',
        motivo: '   ',
        usuarioId: 'user-1',
      }),
    ).rejects.toThrow();
    expect(stockRepositorio.registrarMovimiento).not.toHaveBeenCalled();
  });
});
