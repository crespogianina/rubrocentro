// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP.
//
// Representa una fila de `historial_cotizacion`: append-only, nunca se
// actualiza ni se borra (ver regla de inmutabilidad en CLAUDE.md) — cada
// consulta a la fuente externa que se cachea es una fila nueva.

export interface CotizacionProps {
  id: string;
  tipoCotizacionId: string;
  valor: number;
  fechaHora: Date;
  fuente: string;
}

export class CotizacionInvalidaError extends Error {}
export class CotizacionNoDisponibleError extends Error {}

export class Cotizacion {
  private constructor(private readonly props: CotizacionProps) {}

  static crear(props: Omit<CotizacionProps, 'id'> & { id: string }): Cotizacion {
    if (props.valor <= 0) {
      throw new CotizacionInvalidaError('La cotización necesita un valor mayor a cero.');
    }
    return new Cotizacion(props);
  }

  static reconstruir(props: CotizacionProps): Cotizacion {
    return new Cotizacion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tipoCotizacionId(): string {
    return this.props.tipoCotizacionId;
  }

  get valor(): number {
    return this.props.valor;
  }

  get fechaHora(): Date {
    return this.props.fechaHora;
  }

  get fuente(): string {
    return this.props.fuente;
  }

  toProps(): CotizacionProps {
    return { ...this.props };
  }
}
