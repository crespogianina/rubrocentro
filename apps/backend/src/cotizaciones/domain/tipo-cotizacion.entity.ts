// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP.
//
// Sin `crear()`/invariantes de construcción todavía: esta tarea (Stage 2,
// TASKS.md) solo necesita leer un tipo de cotización ya precargado
// (`oficial`, `blue`, `mep`, `ccl`, `mayorista`...) para resolverlo en
// `ObtenerCotizacionVigente`. El alta de tipos nuevos desde la UI, si hace
// falta más adelante, es la que agregaría esas validaciones — no las
// adelantamos acá sin un caso de uso real que las necesite (ver CLAUDE.md,
// "No overengineering").

export interface TipoCotizacionProps {
  id: string;
  nombre: string; // 'oficial' | 'blue' | 'mep' | 'ccl' | 'mayorista' ...
  fuente: string; // ej: 'dolarapi.com'
  activo: boolean;
}

export class TipoCotizacionInactivoError extends Error {}

export class TipoCotizacion {
  private constructor(private readonly props: TipoCotizacionProps) {}

  static reconstruir(props: TipoCotizacionProps): TipoCotizacion {
    return new TipoCotizacion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get fuente(): string {
    return this.props.fuente;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  toProps(): TipoCotizacionProps {
    return { ...this.props };
  }
}
