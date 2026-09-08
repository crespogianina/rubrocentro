// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP. Es la
// misma clase la use el adaptador de SQLite o, el día de mañana, uno de
// Postgres (ver docs/ARQUITECTURA.md, sección "Arquitectura de software").
//
// INMUTABLE a propósito (ver CLAUDE.md, "Inmutabilidad donde el dominio lo
// exige" y apps/backend/prisma/README.md): un movimiento nunca se edita ni
// se borra una vez creado — por eso esta clase no expone ningún método que
// modifique sus props después de construida. Corregir un movimiento es
// registrar uno nuevo que lo revierte o ajusta.

export type TipoMovimiento = 'venta' | 'compra' | 'ajuste' | 'transferencia' | 'devolucion';

export interface MovimientoProps {
  id: string;
  varianteId: string;
  depositoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  usuarioId: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  fecha: Date;
}

export class MovimientoInvalidoError extends Error {}

export class Movimiento {
  private constructor(private readonly props: MovimientoProps) {}

  static crear(props: Omit<MovimientoProps, 'id' | 'fecha'> & { id: string; fecha?: Date }): Movimiento {
    if (!props.varianteId.trim() || !props.depositoId.trim() || !props.usuarioId.trim()) {
      throw new MovimientoInvalidoError('El movimiento necesita variante, depósito y usuario.');
    }
    if (props.cantidad <= 0) {
      throw new MovimientoInvalidoError('La cantidad de un movimiento debe ser mayor a cero.');
    }
    if (props.tipo === 'ajuste' && !props.motivo?.trim()) {
      // Ver docs/ARQUITECTURA.md, "Operaciones críticas": un ajuste manual
      // de stock siempre requiere motivo, sin excepción.
      throw new MovimientoInvalidoError('Un ajuste de stock necesita un motivo.');
    }
    return new Movimiento({ ...props, fecha: props.fecha ?? new Date() });
  }

  get id(): string {
    return this.props.id;
  }

  get varianteId(): string {
    return this.props.varianteId;
  }

  get depositoId(): string {
    return this.props.depositoId;
  }

  get tipo(): TipoMovimiento {
    return this.props.tipo;
  }

  get cantidad(): number {
    return this.props.cantidad;
  }

  toProps(): MovimientoProps {
    return { ...this.props };
  }
}
