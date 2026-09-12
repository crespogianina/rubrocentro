import { describe, expect, it, vi } from 'vitest';
import { CrearVarianteUseCase } from './crear-variante.use-case.js';
import { Producto } from '../../domain/producto.entity.js';
import { ProductoRepository } from '../ports/producto-repository.port.js';
import { VarianteRepository } from '../ports/variante-repository.port.js';

function crearProductoRepositorioFalso(existeProducto = true): ProductoRepository {
  const producto = Producto.crear({
    id: 'prod-1',
    nombre: 'Producto de prueba',
    categoriaId: 'cat-1',
    marcaId: null,
    unidadMedidaBase: 'unidad',
    monedaCosto: 'ARS',
    costo: 0,
  });
  return {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn().mockResolvedValue(existeProducto ? producto : null),
  };
}

function crearVarianteRepositorioFalso(existeSku = false): VarianteRepository {
  return {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn().mockResolvedValue(null),
    existeSku: vi.fn().mockResolvedValue(existeSku),
  };
}

describe('CrearVarianteUseCase', () => {
  it('crea una variante válida y la persiste vía el repositorio', async () => {
    const productoRepositorio = crearProductoRepositorioFalso();
    const varianteRepositorio = crearVarianteRepositorioFalso();
    const useCase = new CrearVarianteUseCase(productoRepositorio, varianteRepositorio);

    const variante = await useCase.ejecutar({
      productoId: 'prod-ram-kingston-fury-3200',
      sku: 'RAM-KING-FURY-16',
      codigoBarras: null,
      atributos: { capacidad_gb: '16' },
    });

    expect(variante.sku).toBe('RAM-KING-FURY-16');
    expect(variante.toProps().atributos).toEqual({ capacidad_gb: '16' });
    expect(varianteRepositorio.guardar).toHaveBeenCalledTimes(1);
  });

  it('usa un objeto de atributos vacío por defecto si no se especifican', async () => {
    const productoRepositorio = crearProductoRepositorioFalso();
    const varianteRepositorio = crearVarianteRepositorioFalso();
    const useCase = new CrearVarianteUseCase(productoRepositorio, varianteRepositorio);

    const variante = await useCase.ejecutar({
      productoId: 'prod-mouse-logitech-m170',
      sku: 'MOU-LOG-M170',
      codigoBarras: null,
    });

    expect(variante.toProps().atributos).toEqual({});
  });

  it('rechaza una variante para un producto que no existe', async () => {
    const productoRepositorio = crearProductoRepositorioFalso(false);
    const varianteRepositorio = crearVarianteRepositorioFalso();
    const useCase = new CrearVarianteUseCase(productoRepositorio, varianteRepositorio);

    await expect(
      useCase.ejecutar({ productoId: 'no-existe', sku: 'NUEVO-SKU', codigoBarras: null }),
    ).rejects.toThrow();
    expect(varianteRepositorio.guardar).not.toHaveBeenCalled();
  });

  it('rechaza un SKU que ya existe', async () => {
    const productoRepositorio = crearProductoRepositorioFalso();
    const varianteRepositorio = crearVarianteRepositorioFalso(true);
    const useCase = new CrearVarianteUseCase(productoRepositorio, varianteRepositorio);

    await expect(
      useCase.ejecutar({ productoId: 'prod-1', sku: 'YA-EXISTE', codigoBarras: null }),
    ).rejects.toThrow();
    expect(varianteRepositorio.guardar).not.toHaveBeenCalled();
  });

  it('rechaza una variante sin SKU', async () => {
    const productoRepositorio = crearProductoRepositorioFalso();
    const varianteRepositorio = crearVarianteRepositorioFalso();
    const useCase = new CrearVarianteUseCase(productoRepositorio, varianteRepositorio);

    await expect(
      useCase.ejecutar({ productoId: 'prod-1', sku: '   ', codigoBarras: null }),
    ).rejects.toThrow();
    expect(varianteRepositorio.guardar).not.toHaveBeenCalled();
  });
});
