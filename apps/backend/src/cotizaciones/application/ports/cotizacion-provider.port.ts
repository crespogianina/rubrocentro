// Puerto (interfaz) — lo implementa un adaptador de infraestructura (Stage 3
// de TASKS.md: `DolarApiCotizacionProvider`, cliente HTTP a DolarAPI con
// ArgentinaDatos como respaldo). El caso de uso no sabe ni le importa cuál
// de las dos fuentes externas respondió, solo que puede fallar — ver
// docs/ARQUITECTURA.md, sección "Integración con la cotización del dólar".
export interface ValorCotizacionExterno {
  valor: number;
  fuente: string;
}

export interface CotizacionProvider {
  obtenerValorActual(tipoCotizacionNombre: string): Promise<ValorCotizacionExterno>;
}

export const COTIZACION_PROVIDER = Symbol('CotizacionProvider');
