import { describe, expect, it, vi } from 'vitest';
import { StockController } from './stock.controller.js';
import { Movimiento } from '../domain/movimiento.entity.js';
import type { AjustarStockUseCase } from '../application/use-cases/ajustar-stock.use-case.js';
import type { RequestConUsuario } from '../../common/guards/usuario-autenticado.js';

function crearRequestFalsa(usuarioId = 'user-1'): RequestConUsuario {
  return { usuarioAutenticado: { sub: usuarioId, rol: 'encargado' } } as RequestConUsuario;
}

describe('StockController', () => {
  it('mapea el DTO al input del caso de uso, tomando usuarioId del JWT (no del body)', async () => {
    const movimiento = Movimiento.crear({
      id: 'mov-1',
      varianteId: 'var-1',
      depositoId: 'dep-1',
      tipo: 'ajuste_alta',
      cantidad: 5,
      motivo: 'conteo físico',
      usuarioId: 'user-1',
      referenciaTipo: null,
      referenciaId: null,
    });
    const ajustarStock = { ejecutar: vi.fn().mockResolvedValue(movimiento) } as unknown as AjustarStockUseCase;
    const controller = new StockController(ajustarStock);

    const respuesta = await controller.ajustar(
      { varianteId: 'var-1', depositoId: 'dep-1', cantidad: 5, direccion: 'alta', motivo: 'conteo físico' },
      crearRequestFalsa('user-1'),
    );

    expect(respuesta).toEqual(movimiento.toProps());
    expect(ajustarStock.ejecutar).toHaveBeenCalledWith({
      varianteId: 'var-1',
      depositoId: 'dep-1',
      cantidad: 5,
      direccion: 'alta',
      motivo: 'conteo físico',
      usuarioId: 'user-1',
    });
  });

  it('propaga el rechazo del caso de uso (ej. stock insuficiente para una baja)', async () => {
    const ajustarStock = {
      ejecutar: vi.fn().mockRejectedValue(new Error('Stock insuficiente: hay 2 unidad(es) disponible(s) y se pidieron 10.')),
    } as unknown as AjustarStockUseCase;
    const controller = new StockController(ajustarStock);

    await expect(
      controller.ajustar(
        { varianteId: 'var-1', depositoId: 'dep-1', cantidad: 10, direccion: 'baja', motivo: 'rotura' },
        crearRequestFalsa('user-1'),
      ),
    ).rejects.toThrow('Stock insuficiente');
  });
});
