import { describe, expect, it, vi } from 'vitest';
import { CrearProductoUseCase } from './crear-producto.use-case.js';
import { ProductoRepository } from '../ports/producto-repository.port.js';

// Ejemplo de referencia para el resto de los casos de uso (Stage 2 de
// TASKS.md): se testea contra el puerto (una interfaz), nunca contra Prisma
// ni contra un backend HTTP levantado. Rápido, sin I/O, sin Docker.

function crearRepositorioFalso(): ProductoRepository {
  return {
    guardar: vi.fn().mockResolvedValue(undefined),
    buscarPorId: vi.fn().mockResolvedValue(null),
    existeSku: vi.fn().mockResolvedValue(false),
  };
}

describe('CrearProductoUseCase', () => {
  it('crea un producto válido y lo persiste vía el repositorio', async () => {
    const repositorio = crearRepositorioFalso();
    const useCase = new CrearProductoUseCase(repositorio);

    const producto = await useCase.ejecutar({
      nombre: 'Memoria RAM 16GB',
      categoriaId: 'cat-componentes',
      marcaId: null,
      unidadMedidaBase: 'unidad',
      monedaCosto: 'ARS',
      costo: 0,
    });

    expect(producto.nombre).toBe('Memoria RAM 16GB');
    expect(repositorio.guardar).toHaveBeenCalledTimes(1);
  });

  it('rechaza un producto en USD sin costo cargado', async () => {
    const repositorio = crearRepositorioFalso();
    const useCase = new CrearProductoUseCase(repositorio);

    await expect(
      useCase.ejecutar({
        nombre: 'Placa de video',
        categoriaId: 'cat-componentes',
        marcaId: null,
        unidadMedidaBase: 'unidad',
        monedaCosto: 'USD',
        costo: 0,
      }),
    ).rejects.toThrow();
    expect(repositorio.guardar).not.toHaveBeenCalled();
  });
});
