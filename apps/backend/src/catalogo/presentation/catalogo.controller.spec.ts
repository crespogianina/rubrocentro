import { describe, expect, it, vi } from 'vitest';
import { CatalogoController } from './catalogo.controller.js';
import { Producto } from '../domain/producto.entity.js';
import { Variante } from '../domain/variante.entity.js';
import type { CrearProductoUseCase } from '../application/use-cases/crear-producto.use-case.js';
import type { CrearVarianteUseCase } from '../application/use-cases/crear-variante.use-case.js';

describe('CatalogoController', () => {
  describe('crear (producto)', () => {
    it('mapea el DTO al input del caso de uso y devuelve el producto creado', async () => {
      const producto = Producto.crear({
        id: 'prod-1',
        nombre: 'Memoria RAM 16GB',
        categoriaId: 'cat-1',
        marcaId: null,
        unidadMedidaBase: 'unidad',
        monedaCosto: 'ARS',
        costo: 0,
      });
      const crearProducto = { ejecutar: vi.fn().mockResolvedValue(producto) } as unknown as CrearProductoUseCase;
      const crearVariante = {} as CrearVarianteUseCase;
      const controller = new CatalogoController(crearProducto, crearVariante);

      const respuesta = await controller.crear({
        nombre: 'Memoria RAM 16GB',
        categoriaId: 'cat-1',
        unidadMedidaBase: 'unidad',
        monedaCosto: 'ARS',
        costo: 0,
      });

      expect(respuesta).toEqual(producto.toProps());
      expect(crearProducto.ejecutar).toHaveBeenCalledWith({
        nombre: 'Memoria RAM 16GB',
        categoriaId: 'cat-1',
        marcaId: null,
        unidadMedidaBase: 'unidad',
        monedaCosto: 'ARS',
        costo: 0,
      });
    });

    it('propaga el rechazo del caso de uso (ej. ProductoInvalidoError)', async () => {
      const crearProducto = {
        ejecutar: vi.fn().mockRejectedValue(new Error('El producto necesita un nombre.')),
      } as unknown as CrearProductoUseCase;
      const controller = new CatalogoController(crearProducto, {} as CrearVarianteUseCase);

      await expect(
        controller.crear({
          nombre: '',
          categoriaId: 'cat-1',
          unidadMedidaBase: 'unidad',
          monedaCosto: 'ARS',
          costo: 0,
        }),
      ).rejects.toThrow('El producto necesita un nombre.');
    });
  });

  describe('crearVarianteDeProducto', () => {
    it('combina el productoId de la ruta con el DTO del body', async () => {
      const variante = Variante.crear({
        id: 'var-1',
        productoId: 'prod-1',
        sku: 'RAM-16',
        codigoBarras: null,
        atributos: { capacidad_gb: '16' },
      });
      const crearVariante = { ejecutar: vi.fn().mockResolvedValue(variante) } as unknown as CrearVarianteUseCase;
      const controller = new CatalogoController({} as CrearProductoUseCase, crearVariante);

      const respuesta = await controller.crearVarianteDeProducto('prod-1', {
        sku: 'RAM-16',
        codigoBarras: null,
        atributos: { capacidad_gb: '16' },
      });

      expect(respuesta).toEqual(variante.toProps());
      expect(crearVariante.ejecutar).toHaveBeenCalledWith({
        productoId: 'prod-1',
        sku: 'RAM-16',
        codigoBarras: null,
        atributos: { capacidad_gb: '16' },
      });
    });
  });
});
