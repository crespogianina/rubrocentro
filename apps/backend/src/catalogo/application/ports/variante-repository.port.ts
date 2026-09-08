import { Variante } from '../../domain/variante.entity.js';

// Puerto (interfaz) — lo implementa un adaptador de infraestructura
// (Stage 3 de TASKS.md: PrismaVarianteRepository). El caso de uso no sabe
// ni le importa si detrás hay SQLite, Postgres o un mock de test.
export interface VarianteRepository {
  guardar(variante: Variante): Promise<void>;
  buscarPorId(id: string): Promise<Variante | null>;
  existeSku(sku: string): Promise<boolean>;
}

export const VARIANTE_REPOSITORY = Symbol('VarianteRepository');
