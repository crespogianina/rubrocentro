// Tipos compartidos entre frontend y backend.
//
// Regla: acá solo van formas de datos (DTOs), nunca lógica de negocio ni
// dependencias de NestJS/Angular — este paquete lo importan los dos.
// El modelo completo está en docs/ARQUITECTURA.md (sección "Modelo de datos");
// esto es solo el punto de partida, se va completando a medida que se
// construye cada módulo (ver TASKS.md).

export type RolNombre = 'admin' | 'encargado' | 'vendedor' | 'tecnico';

export interface ProductoDTO {
  id: string;
  nombre: string;
  categoriaId: string;
  marcaId: string | null;
  unidadMedidaBase: string;
  monedaCosto: 'ARS' | 'USD';
}

export interface VarianteDTO {
  id: string;
  productoId: string;
  sku: string;
  codigoBarras: string | null;
  atributos: Record<string, string>;
}

export type TipoMovimiento =
  | 'venta'
  | 'compra'
  | 'ajuste_alta'
  | 'ajuste_baja'
  | 'transferencia'
  | 'devolucion';

export interface MovimientoDTO {
  id: string;
  varianteId: string;
  depositoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  usuarioId: string;
  fecha: string; // ISO 8601, UTC
}

export interface ErrorRespuestaDTO {
  mensaje: string;
  codigo: string;
}
