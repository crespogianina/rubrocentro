// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP. Es la
// misma clase la use el adaptador de SQLite o, el día de mañana, uno de
// Postgres (ver docs/ARQUITECTURA.md, sección "Arquitectura de software").

export type MonedaCosto = 'ARS' | 'USD';

export interface ProductoProps {
  id: string;
  nombre: string;
  categoriaId: string;
  marcaId: string | null;
  unidadMedidaBase: string;
  monedaCosto: MonedaCosto;
  costo: number;
}

export class ProductoInvalidoError extends Error {}

export class Producto {
  private constructor(private readonly props: ProductoProps) {}

  static crear(props: Omit<ProductoProps, 'id'> & { id: string }): Producto {
    if (!props.nombre.trim()) {
      throw new ProductoInvalidoError('El producto necesita un nombre.');
    }
    if (props.monedaCosto === 'USD' && props.costo <= 0) {
      // Regla de negocio real: un producto en USD sin costo cargado no se
      // puede usar para sugerir precio (ver sección "Cotización del dólar").
      throw new ProductoInvalidoError(
        'Un producto con costo en USD necesita un costo mayor a cero.',
      );
    }
    return new Producto(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  toProps(): ProductoProps {
    return { ...this.props };
  }
}
