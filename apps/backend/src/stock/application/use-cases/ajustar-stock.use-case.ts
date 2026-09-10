import { Injectable } from '@nestjs/common';
import { Movimiento } from '../../domain/movimiento.entity.js';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.use-case.js';

export type DireccionAjuste = 'alta' | 'baja';

export interface AjustarStockInput {
  varianteId: string;
  depositoId: string;
  cantidad: number;
  direccion: DireccionAjuste;
  motivo: string;
  usuarioId: string;
}

// Wrapper fino sobre RegistrarMovimiento: le da al ajuste manual una entrada
// explícita ('alta'/'baja' en vez de un tipo de movimiento crudo) pensada
// para la pantalla de Stage 6 ("consulta + ajuste manual"). La validación de
// stock disponible para 'baja' y la exigencia de motivo ya las resuelve
// RegistrarMovimiento/la entidad Movimiento — no se duplican acá.
@Injectable()
export class AjustarStockUseCase {
  constructor(private readonly registrarMovimiento: RegistrarMovimientoUseCase) {}

  async ejecutar(input: AjustarStockInput): Promise<Movimiento> {
    return this.registrarMovimiento.ejecutar({
      varianteId: input.varianteId,
      depositoId: input.depositoId,
      tipo: input.direccion === 'alta' ? 'ajuste_alta' : 'ajuste_baja',
      cantidad: input.cantidad,
      motivo: input.motivo,
      usuarioId: input.usuarioId,
      referenciaTipo: null,
      referenciaId: null,
    });
  }
}
