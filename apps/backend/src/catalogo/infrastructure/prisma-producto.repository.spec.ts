import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaProductoRepository } from './prisma-producto.repository.js';
import { Producto } from '../domain/producto.entity.js';
import { crearPrismaDeTest } from '../../../test/prisma-test-db.js';
import type { PrismaTestDb } from '../../../test/prisma-test-db.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// Integration test contra un SQLite de prueba real (Stage 3, TASKS.md) — a
// diferencia de los tests de casos de uso (Stage 2), acá sí se ejercita
// Prisma de punta a punta: migración del schema, FKs reales, upsert.
describe('PrismaProductoRepository', () => {
  let db: PrismaTestDb;
  let repositorio: PrismaProductoRepository;
  let categoriaId: string;

  beforeAll(async () => {
    db = crearPrismaDeTest();
    repositorio = new PrismaProductoRepository(db.prisma as unknown as PrismaService);

    const categoria = await db.prisma.categoria.create({ data: { nombre: 'Componentes' } });
    categoriaId = categoria.id;
  }, 30_000);

  afterAll(async () => {
    await db.cerrar();
  });

  it('guarda un producto nuevo y lo puede volver a buscar por id', async () => {
    const producto = Producto.crear({
      id: 'prod-test-1',
      nombre: 'Memoria RAM 16GB',
      categoriaId,
      marcaId: null,
      unidadMedidaBase: 'unidad',
      monedaCosto: 'ARS',
      costo: 0,
    });

    await repositorio.guardar(producto);
    const encontrado = await repositorio.buscarPorId('prod-test-1');

    expect(encontrado).not.toBeNull();
    expect(encontrado?.nombre).toBe('Memoria RAM 16GB');
  });

  it('guardar sobre un producto existente actualiza la fila en vez de duplicarla', async () => {
    const original = Producto.crear({
      id: 'prod-test-2',
      nombre: 'Placa de video',
      categoriaId,
      marcaId: null,
      unidadMedidaBase: 'unidad',
      monedaCosto: 'USD',
      costo: 100,
    });
    await repositorio.guardar(original);

    const actualizado = Producto.crear({
      id: 'prod-test-2',
      nombre: 'Placa de video RTX',
      categoriaId,
      marcaId: null,
      unidadMedidaBase: 'unidad',
      monedaCosto: 'USD',
      costo: 150,
    });
    await repositorio.guardar(actualizado);

    const encontrado = await repositorio.buscarPorId('prod-test-2');
    expect(encontrado?.nombre).toBe('Placa de video RTX');
    expect(encontrado?.toProps().costo).toBe(150);
  });

  it('devuelve null si el producto no existe', async () => {
    const encontrado = await repositorio.buscarPorId('no-existe');
    expect(encontrado).toBeNull();
  });

  it('devuelve null para un producto con soft-delete (deletedAt seteado)', async () => {
    const producto = Producto.crear({
      id: 'prod-test-borrado',
      nombre: 'Producto descontinuado',
      categoriaId,
      marcaId: null,
      unidadMedidaBase: 'unidad',
      monedaCosto: 'ARS',
      costo: 0,
    });
    await repositorio.guardar(producto);
    await db.prisma.producto.update({
      where: { id: 'prod-test-borrado' },
      data: { deletedAt: new Date() },
    });

    const encontrado = await repositorio.buscarPorId('prod-test-borrado');
    expect(encontrado).toBeNull();
  });
});
