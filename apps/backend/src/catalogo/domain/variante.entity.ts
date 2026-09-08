// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP. Es la
// misma clase la use el adaptador de SQLite o, el día de mañana, uno de
// Postgres (ver docs/ARQUITECTURA.md, sección "Arquitectura de software").

export type Atributos = Record<string, string>;

export interface VarianteProps {
  id: string;
  productoId: string;
  sku: string;
  codigoBarras: string | null;
  atributos: Atributos;
}

export class VarianteInvalidaError extends Error {}

export class Variante {
  private constructor(private readonly props: VarianteProps) {}

  static crear(
    props: Omit<VarianteProps, 'id' | 'atributos'> & { id: string; atributos?: Atributos },
  ): Variante {
    if (!props.productoId.trim()) {
      throw new VarianteInvalidaError('La variante necesita un producto.');
    }
    if (!props.sku.trim()) {
      throw new VarianteInvalidaError('La variante necesita un SKU.');
    }
    // Prisma 7.10.0 no admite un @default("{}") para este campo (ver
    // apps/backend/prisma/README.md) — el default real lo pone acá el dominio.
    return new Variante({ ...props, atributos: props.atributos ?? {} });
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get productoId(): string {
    return this.props.productoId;
  }

  toProps(): VarianteProps {
    return { ...this.props };
  }
}
