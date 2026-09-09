import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Movimiento, MovimientoInvalidoError } from '../../domain/movimiento.entity.js';
import type { MovimientoProps } from '../../domain/movimiento.entity.js';
import { STOCK_REPOSITORY } from '../ports/stock-repository.port.js';
import type { StockRepository } from '../ports/stock-repository.port.js';

export type RegistrarMovimientoInput = Omit<MovimientoProps, 'id' | 'fecha'>;

@Injectable()
export class RegistrarMovimientoUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
  ) {}

  async ejecutar(input: RegistrarMovimientoInput): Promise<Movimiento> {
    // 'venta' y 'ajuste_baja' son los únicos tipos que restan stock hoy
    // (compra/ajuste_alta suman; transferencia/devolucion todavía no tienen
    // caso de uso que los dispare) — a ninguno de los dos se lo puede dejar
    // en negativo.
    if (input.tipo === 'venta' || input.tipo === 'ajuste_baja') {
      const stockActual = await this.stockRepository.obtenerStockActual(
        input.varianteId,
        input.depositoId,
      );
      if (stockActual < input.cantidad) {
        // Regla de negocio (ver docs/ARQUITECTURA.md, "Funcionales" y
        // CLAUDE.md): no se puede restar más stock del disponible.
        throw new MovimientoInvalidoError(
          `Stock insuficiente: hay ${stockActual} unidad(es) disponible(s) y se pidieron ${input.cantidad}.`,
        );
      }
    }

    const movimiento = Movimiento.crear({ id: randomUUID(), ...input });
    await this.stockRepository.registrarMovimiento(movimiento);
    return movimiento;
  }
}
