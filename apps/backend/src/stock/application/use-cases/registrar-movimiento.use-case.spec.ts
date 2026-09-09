import { describe, expect, it, vi } from 'vitest';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.use-case.js';
import { StockRepository } from '../ports/stock-repository.port.js';

// Task 1 de Stage 2/stock (TASKS.md): RegistrarMovimiento para venta, con la
// validación "no permitir vender más stock del disponible". Los tipos
// compra/ajuste se extienden y testean en la tarea siguiente.

function crearStockRepositorioFalso(stockActual = 5): StockRepository {
  return {
    registrarMovimiento: vi.fn().mockResolvedValue(undefined),
    obtenerStockActual: vi.fn().mockResolvedValue(stockActual),
  };
}

function inputVenta(overrides: Partial<Parameters<RegistrarMovimientoUseCase['ejecutar']>[0]> = {}) {
  return {
    varianteId: 'var-1',
    depositoId: 'dep-1',
    tipo: 'venta' as const,
    cantidad: 1,
    motivo: null,
    usuarioId: 'user-1',
    referenciaTipo: null,
    referenciaId: null,
    ...overrides,
  };
}

describe('RegistrarMovimientoUseCase', () => {
  it('registra una venta cuando hay stock suficiente', async () => {
    const stockRepositorio = crearStockRepositorioFalso(5);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    const movimiento = await useCase.ejecutar(inputVenta({ cantidad: 3 }));

    expect(movimiento.tipo).toBe('venta');
    expect(movimiento.cantidad).toBe(3);
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledTimes(1);
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledWith(movimiento);
  });

  it('permite vender exactamente el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(3);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    const movimiento = await useCase.ejecutar(inputVenta({ cantidad: 3 }));

    expect(movimiento.cantidad).toBe(3);
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledTimes(1);
  });

  it('rechaza una venta que supera el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(2);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    await expect(useCase.ejecutar(inputVenta({ cantidad: 5 }))).rejects.toThrow();
    expect(stockRepositorio.registrarMovimiento).not.toHaveBeenCalled();
  });

  it('consulta el stock del depósito y variante correctos antes de registrar', async () => {
    const stockRepositorio = crearStockRepositorioFalso(10);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    await useCase.ejecutar(inputVenta({ varianteId: 'var-9', depositoId: 'dep-9', cantidad: 1 }));

    expect(stockRepositorio.obtenerStockActual).toHaveBeenCalledWith('var-9', 'dep-9');
  });
});
