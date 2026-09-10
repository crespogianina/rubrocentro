import { Movimiento } from '../../domain/movimiento.entity.js';

// Puerto (interfaz) — lo implementa un adaptador de infraestructura
// (Stage 3 de TASKS.md: PrismaStockRepository). Ese adaptador es responsable
// de que registrar un movimiento y actualizar `stock.cantidad` pasen en la
// misma transacción — el puerto no lo expone porque es un detalle de
// infraestructura, no una decisión de negocio.
export interface StockRepository {
  registrarMovimiento(movimiento: Movimiento): Promise<void>;
  obtenerStockActual(varianteId: string, depositoId: string): Promise<number>;
}

export const STOCK_REPOSITORY = Symbol('StockRepository');
