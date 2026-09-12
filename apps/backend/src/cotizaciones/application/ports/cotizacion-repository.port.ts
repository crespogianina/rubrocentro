import { Cotizacion } from '../../domain/cotizacion.entity.js';
import { TipoCotizacion } from '../../domain/tipo-cotizacion.entity.js';

// Puerto (interfaz) — lo implementa un adaptador de infraestructura (Stage 3
// de TASKS.md: `PrismaCotizacionRepository`). El caso de uso no sabe ni le
// importa si detrás hay SQLite, Postgres o un mock de test.
export interface CotizacionRepository {
  buscarTipoPorId(id: string): Promise<TipoCotizacion | null>;
  // Última fila cacheada en `historial_cotizacion` para ese tipo — es el
  // fallback cuando la fuente externa falla (ver docs/ARQUITECTURA.md,
  // sección "Offline / local-first").
  buscarUltimaCotizacion(tipoCotizacionId: string): Promise<Cotizacion | null>;
  guardarCotizacion(cotizacion: Cotizacion): Promise<void>;
}

export const COTIZACION_REPOSITORY = Symbol('CotizacionRepository');
