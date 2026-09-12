import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaVarianteRepository } from './prisma-variante.repository.js';
import { Variante } from '../domain/variante.entity.js';
import { crearPrismaDeTest } from '../../../test/prisma-test-db.js';
import type { PrismaTestDb } from '../../../test/prisma-test-db.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// Integration test contra un SQLite de prueba real (Stage 3, TASKS.md) —
// mismo patrón que prisma-producto.repository.spec.ts.
describe('PrismaVarianteRepository', () => {
  let db: PrismaTestDb;
  let repositorio: PrismaVarianteRepository;
  let productoId: string;

  beforeAll(async () => {
    db = crearPrismaDeTest();
    repositorio = new PrismaVarianteRepository(db.prisma as unknown as PrismaService);

    const categoria = await db.prisma.categoria.create({ data: { nombre: 'Componentes' } });
    const producto = await db.prisma.producto.create({
      data: { nombre: 'Memoria RAM 16GB', categoriaId: categoria.id, unidadMedidaBase: 'unidad' },
    });
    productoId = producto.id;
  }, 30_000);

  afterAll(async () => {
    await db.cerrar();
  });

  it('guarda una variante nueva y la puede volver a buscar por id', async () => {
    const variante = Variante.crear({
      id: 'var-test-1',
      productoId,
      sku: 'RAM-KING-16',
      codigoBarras: null,
      atributos: { capacidad_gb: '16' },
    });

    await repositorio.guardar(variante);
    const encontrada = await repositorio.buscarPorId('var-test-1');

    expect(encontrada).not.toBeNull();
    expect(encontrada?.sku).toBe('RAM-KING-16');
    expect(encontrada?.toProps().atributos).toEqual({ capacidad_gb: '16' });
  });

  it('guardar sobre una variante existente actualiza la fila en vez de duplicarla', async () => {
    const original = Variante.crear({
      id: 'var-test-2',
      productoId,
      sku: 'MOU-LOG-M170',
      codigoBarras: null,
    });
    await repositorio.guardar(original);

    const actualizada = Variante.crear({
      id: 'var-test-2',
      productoId,
      sku: 'MOU-LOG-M170',
      codigoBarras: '7891234560001',
    });
    await repositorio.guardar(actualizada);

    const encontrada = await repositorio.buscarPorId('var-test-2');
    expect(encontrada?.toProps().codigoBarras).toBe('7891234560001');
  });

  it('devuelve null si la variante no existe', async () => {
    const encontrada = await repositorio.buscarPorId('no-existe');
    expect(encontrada).toBeNull();
  });

  it('devuelve null para una variante con soft-delete (deletedAt seteado)', async () => {
    const variante = Variante.crear({
      id: 'var-test-borrada',
      productoId,
      sku: 'DESCONTINUADO-1',
      codigoBarras: null,
    });
    await repositorio.guardar(variante);
    await db.prisma.variante.update({
      where: { id: 'var-test-borrada' },
      data: { deletedAt: new Date() },
    });

    const encontrada = await repositorio.buscarPorId('var-test-borrada');
    expect(encontrada).toBeNull();
  });

  describe('existeSku', () => {
    it('devuelve true si hay una variante activa con ese SKU', async () => {
      await repositorio.guardar(
        Variante.crear({ id: 'var-test-sku-1', productoId, sku: 'SKU-UNICO-1', codigoBarras: null }),
      );

      expect(await repositorio.existeSku('SKU-UNICO-1')).toBe(true);
    });

    it('devuelve false si no hay ninguna variante con ese SKU', async () => {
      expect(await repositorio.existeSku('SKU-QUE-NO-EXISTE')).toBe(false);
    });

    it('devuelve false si la única variante con ese SKU tiene soft-delete', async () => {
      await repositorio.guardar(
        Variante.crear({ id: 'var-test-sku-borrada', productoId, sku: 'SKU-BORRADO-1', codigoBarras: null }),
      );
      await db.prisma.variante.update({
        where: { id: 'var-test-sku-borrada' },
        data: { deletedAt: new Date() },
      });

      expect(await repositorio.existeSku('SKU-BORRADO-1')).toBe(false);
    });
  });
});
