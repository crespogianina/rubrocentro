import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CotizacionProvider, ValorCotizacionExterno } from '../application/ports/cotizacion-provider.port.js';

// Mapea el catálogo abierto `tipo_cotizacion.nombre` (Stage 1) a la "casa"
// que usan DolarAPI/ArgentinaDatos en sus URLs — no son el mismo nombre
// para MEP ni para CCL (ver docs/ARQUITECTURA.md, sección "Integración con
// la cotización del dólar").
const NOMBRE_A_CASA: Record<string, string> = {
  oficial: 'oficial',
  blue: 'blue',
  mep: 'bolsa',
  ccl: 'contadoconliqui',
  mayorista: 'mayorista',
};

const ARGENTINA_DATOS_URL = 'https://api.argentinadatos.com/v1';
const TIMEOUT_MS = 5_000;

interface DolarApiRespuesta {
  venta: number;
}

interface ArgentinaDatosEntrada {
  venta: number;
}

// Adaptador de infraestructura — implementa el puerto `CotizacionProvider`
// (Stage 2). DolarAPI es la fuente primaria; si falla (caída, timeout,
// respuesta inválida), cae a ArgentinaDatos como respaldo antes de
// propagar el error. El fallback final a la última cotización cacheada
// cuando las dos fuentes externas fallan lo resuelve el caso de uso
// `ObtenerCotizacionVigente` (Stage 2), no este adaptador.
@Injectable()
export class DolarApiCotizacionProvider implements CotizacionProvider {
  constructor(private readonly configService: ConfigService) {}

  async obtenerValorActual(tipoCotizacionNombre: string): Promise<ValorCotizacionExterno> {
    const casa = this.resolverCasa(tipoCotizacionNombre);

    try {
      return await this.consultarDolarApi(casa);
    } catch {
      return await this.consultarArgentinaDatos(casa);
    }
  }

  private resolverCasa(tipoCotizacionNombre: string): string {
    const casa = NOMBRE_A_CASA[tipoCotizacionNombre.toLowerCase()];
    if (!casa) {
      throw new Error(
        `No hay mapeo de casa de cambio para el tipo de cotización "${tipoCotizacionNombre}".`,
      );
    }
    return casa;
  }

  private async consultarDolarApi(casa: string): Promise<ValorCotizacionExterno> {
    const baseUrl = this.configService.get<string>('DOLAR_API_URL') ?? 'https://dolarapi.com/v1';
    const respuesta = await this.fetchConTimeout(`${baseUrl}/dolares/${casa}`);
    if (!respuesta.ok) {
      throw new Error(`DolarAPI respondió ${respuesta.status}.`);
    }

    const datos = (await respuesta.json()) as DolarApiRespuesta;
    if (typeof datos.venta !== 'number') {
      throw new Error('Respuesta de DolarAPI sin campo "venta" numérico.');
    }
    return { valor: datos.venta, fuente: 'dolarapi.com' };
  }

  private async consultarArgentinaDatos(casa: string): Promise<ValorCotizacionExterno> {
    const respuesta = await this.fetchConTimeout(
      `${ARGENTINA_DATOS_URL}/cotizaciones/dolares/${casa}`,
    );
    if (!respuesta.ok) {
      throw new Error(`ArgentinaDatos respondió ${respuesta.status}.`);
    }

    // El endpoint devuelve la serie histórica completa ordenada de más
    // vieja a más nueva — el último elemento es la cotización vigente.
    const datos = (await respuesta.json()) as ArgentinaDatosEntrada[];
    const ultimo = datos.at(-1);
    if (!ultimo || typeof ultimo.venta !== 'number') {
      throw new Error('Respuesta de ArgentinaDatos vacía o sin campo "venta" numérico.');
    }
    return { valor: ultimo.venta, fuente: 'argentinadatos.com' };
  }

  private async fetchConTimeout(url: string): Promise<Response> {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, { signal: controlador.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
