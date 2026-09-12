import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Movimiento, MovimientoInvalidoError } from '../domain/movimiento.entity.js';
import type { StockRepository } from '../application/ports/stock-repository.port.js';

// 'transferencia' todavía no tiene semántica de negocio definida (el
// `Movimiento` actual no distingue depósito origen/destino) — no
// adelantamos esa decisión sin un caso de uso real que la necesite (ver
// README de este módulo y CLAUDE.md, "No overengineering").
const TIPOS_QUE_SUMAN = new Set(['compra', 'ajuste_alta', 'devolucion']);
const TIPOS_QUE_RESTAN = new Set(['venta', 'ajuste_baja']);

// Adaptador de infraestructura — implementa el puerto `StockRepository`
// (Stage 2) contra Prisma/SQLite. El alta del movimiento (inmutable,
// append-only) y el ajuste de `stock.cantidad` pasan en una única
// transacción: o pasan los dos, o no pasa ninguno.
@Injectable()
export class PrismaStockRepository implements StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrarMovimiento(movimiento: Movimiento): Promise<void> {
    const props = movimiento.toProps();

    await this.prisma.$transaction(async (tx) => {
      await tx.movimiento.create({
        data: {
          id: props.id,
          varianteId: props.varianteId,
          depositoId: props.depositoId,
          tipo: props.tipo,
          cantidad: props.cantidad,
          motivo: props.motivo,
          usuarioId: props.usuarioId,
          referenciaTipo: props.referenciaTipo,
          referenciaId: props.referenciaId,
          fecha: props.fecha,
        },
      });

      // Si el tipo no tiene delta de stock definido, esto tira y Prisma
      // revierte también el `movimiento.create` de arriba — o pasan los
      // dos cambios, o no pasa ninguno.
      const delta = this.calcularDelta(props.tipo, props.cantidad);

      await tx.stock.upsert({
        where: {
          varianteId_depositoId: { varianteId: props.varianteId, depositoId: props.depositoId },
        },
        update: { cantidad: { increment: delta } },
        create: { varianteId: props.varianteId, depositoId: props.depositoId, cantidad: delta },
      });
    });
  }

  async obtenerStockActual(varianteId: string, depositoId: string): Promise<number> {
    const fila = await this.prisma.stock.findUnique({
      where: { varianteId_depositoId: { varianteId, depositoId } },
    });
    return fila?.cantidad ?? 0;
  }

  private calcularDelta(tipo: string, cantidad: number): number {
    if (TIPOS_QUE_SUMAN.has(tipo)) return cantidad;
    if (TIPOS_QUE_RESTAN.has(tipo)) return -cantidad;
    throw new MovimientoInvalidoError(
      `Tipo de movimiento "${tipo}" todavía no tiene soporte de stock.`,
    );
  }
}
