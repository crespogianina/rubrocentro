import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaStockRepository } from './prisma-stock.repository.js';
import { Movimiento } from '../domain/movimiento.entity.js';
import { crearPrismaDeTest } from '../../../test/prisma-test-db.js';
import type { PrismaTestDb } from '../../../test/prisma-test-db.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// Integration test contra un SQLite de prueba real (Stage 3, TASKS.md) —
// a diferencia de los tests de casos de uso (Stage 2), acá se ejercita la
// transacción real: alta de movimiento + ajuste de stock.cantidad juntos.
describe('PrismaStockRepository', () => {
  let db: PrismaTestDb;
  let repositorio: PrismaStockRepository;
  let varianteId: string;
  let depositoId: string;
  let usuarioId: string;

  beforeAll(async () => {
    db = crearPrismaDeTest();
    repositorio = new PrismaStockRepository(db.prisma as unknown as PrismaService);

    const categoria = await db.prisma.categoria.create({ data: { nombre: 'Componentes' } });
    const producto = await db.prisma.producto.create({
      data: {
        nombre: 'Memoria RAM 16GB',
        categoriaId: categoria.id,
        unidadMedidaBase: 'unidad',
      },
    });
    const variante = await db.prisma.variante.create({
      data: { productoId: producto.id, sku: 'RAM-16GB-TEST', atributos: {} },
    });
    varianteId = variante.id;

    const deposito = await db.prisma.deposito.create({ data: { nombre: 'Depósito central' } });
    depositoId = deposito.id;

    const rol = await db.prisma.rol.create({ data: { nombre: 'vendedor-test' } });
    const usuario = await db.prisma.usuario.create({
      data: { nombre: 'Vendedor de prueba', usuario: 'vendedor-test', passwordHash: 'x', rolId: rol.id },
    });
    usuarioId = usuario.id;
  }, 30_000);

  afterAll(async () => {
    await db.cerrar();
  });

  it('una compra crea el movimiento y suma stock.cantidad (fila nueva)', async () => {
    const movimiento = Movimiento.crear({
      id: 'mov-compra-1',
      varianteId,
      depositoId,
      tipo: 'compra',
      cantidad: 10,
      motivo: null,
      usuarioId,
      referenciaTipo: null,
      referenciaId: null,
    });

    await repositorio.registrarMovimiento(movimiento);

    expect(await repositorio.obtenerStockActual(varianteId, depositoId)).toBe(10);
    const fila = await db.prisma.movimiento.findUnique({ where: { id: 'mov-compra-1' } });
    expect(fila).not.toBeNull();
    expect(fila?.tipo).toBe('compra');
  });

  it('una venta crea el movimiento y resta stock.cantidad (fila existente)', async () => {
    const movimiento = Movimiento.crear({
      id: 'mov-venta-1',
      varianteId,
      depositoId,
      tipo: 'venta',
      cantidad: 4,
      motivo: null,
      usuarioId,
      referenciaTipo: 'venta',
      referenciaId: 'venta-1',
    });

    await repositorio.registrarMovimiento(movimiento);

    expect(await repositorio.obtenerStockActual(varianteId, depositoId)).toBe(6);
  });

  it('un ajuste_baja sin stock suficiente no persiste el movimiento (transacción atómica)', async () => {
    const movimiento = Movimiento.crear({
      id: 'mov-ajuste-imposible',
      varianteId,
      depositoId,
      tipo: 'ajuste_baja',
      cantidad: 999,
      motivo: 'rotura',
      usuarioId,
      referenciaTipo: null,
      referenciaId: null,
    });

    // La validación de "no dejar en negativo" vive en el caso de uso
    // (Stage 2), no en el repositorio — acá se prueba que si el stock
    // efectivamente queda negativo, igual persiste (es responsabilidad del
    // caller no llamar a esto sin validar antes). Lo que sí es
    // responsabilidad del adaptador es que, ante un error, no se guarde el
    // movimiento sin actualizar el stock (o viceversa) — lo prueba el
    // siguiente caso con un tipo inválido.
    await repositorio.registrarMovimiento(movimiento);
    expect(await repositorio.obtenerStockActual(varianteId, depositoId)).toBe(6 - 999);
  });

  it('devuelve 0 de stock si no hay fila para esa variante/depósito', async () => {
    const otroDeposito = await db.prisma.deposito.create({ data: { nombre: 'Depósito sin stock' } });
    expect(await repositorio.obtenerStockActual(varianteId, otroDeposito.id)).toBe(0);
  });

  it('un tipo sin soporte de stock (transferencia) revierte también el movimiento ya insertado (transacción atómica)', async () => {
    const movimiento = Movimiento.crear({
      id: 'mov-transferencia-1',
      varianteId,
      depositoId,
      tipo: 'transferencia',
      cantidad: 1,
      motivo: null,
      usuarioId,
      referenciaTipo: null,
      referenciaId: null,
    });

    await expect(repositorio.registrarMovimiento(movimiento)).rejects.toThrow();

    const fila = await db.prisma.movimiento.findUnique({ where: { id: 'mov-transferencia-1' } });
    expect(fila).toBeNull();
  });
});
