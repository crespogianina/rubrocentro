import { Producto } from '../../domain/producto.entity.js';

// Puerto (interfaz) — lo implementa un adaptador de infraestructura
// (Stage 3 de TASKS.md: PrismaProductoRepository). El caso de uso no sabe
// ni le importa si detrás hay SQLite, Postgres o un mock de test.
export interface ProductoRepository {
  guardar(producto: Producto): Promise<void>;
  buscarPorId(id: string): Promise<Producto | null>;
}

export const PRODUCTO_REPOSITORY = Symbol('ProductoRepository');
