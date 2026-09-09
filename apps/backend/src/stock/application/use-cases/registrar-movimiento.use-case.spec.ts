import { describe, expect, it, vi } from 'vitest';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.use-case.js';
import { StockRepository } from '../ports/stock-repository.port.js';

// Stage 2/stock (TASKS.md): RegistrarMovimiento para venta (con la
// validación "no permitir vender más stock del disponible") y su extensión
// a compra y ajuste — compra no valida stock disponible (siempre suma), y
// ajuste delega en la entidad Movimiento la exigencia de motivo.

function crearStockRepositorioFalso(stockActual = 5): StockRepository {
  return {
    registrarMovimiento: vi.fn().mockResolvedValue(undefined),
    obtenerStockActual: vi.fn().mockResolvedValue(stockActual),
  };
}

type Input = Parameters<RegistrarMovimientoUseCase['ejecutar']>[0];

function inputBase(overrides: Partial<Input> = {}): Input {
  return {
    varianteId: 'var-1',
    depositoId: 'dep-1',
    tipo: 'venta',
    cantidad: 1,
    motivo: null,
    usuarioId: 'user-1',
    referenciaTipo: null,
    referenciaId: null,
    ...overrides,
  };
}

function inputVenta(overrides: Partial<Input> = {}): Input {
  return inputBase({ tipo: 'venta', ...overrides });
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

  it('registra una compra sin consultar el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(0);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    const movimiento = await useCase.ejecutar(
      inputBase({ tipo: 'compra', cantidad: 50, referenciaTipo: 'compra', referenciaId: 'compra-1' }),
    );

    expect(movimiento.tipo).toBe('compra');
    expect(stockRepositorio.obtenerStockActual).not.toHaveBeenCalled();
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledWith(movimiento);
  });

  it('registra un ajuste con motivo sin consultar el stock disponible', async () => {
    const stockRepositorio = crearStockRepositorioFalso(0);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    const movimiento = await useCase.ejecutar(
      inputBase({ tipo: 'ajuste', cantidad: 2, motivo: 'Rotura detectada en control de stock' }),
    );

    expect(movimiento.tipo).toBe('ajuste');
    expect(stockRepositorio.obtenerStockActual).not.toHaveBeenCalled();
    expect(stockRepositorio.registrarMovimiento).toHaveBeenCalledWith(movimiento);
  });

  it('rechaza un ajuste sin motivo y no persiste nada', async () => {
    const stockRepositorio = crearStockRepositorioFalso(10);
    const useCase = new RegistrarMovimientoUseCase(stockRepositorio);

    await expect(
      useCase.ejecutar(inputBase({ tipo: 'ajuste', cantidad: 2, motivo: null })),
    ).rejects.toThrow();
    expect(stockRepositorio.registrarMovimiento).not.toHaveBeenCalled();
  });
});
