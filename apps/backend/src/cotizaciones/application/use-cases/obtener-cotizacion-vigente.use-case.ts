import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Cotizacion, CotizacionNoDisponibleError } from '../../domain/cotizacion.entity.js';
import { TipoCotizacionInactivoError } from '../../domain/tipo-cotizacion.entity.js';
import { COTIZACION_PROVIDER } from '../ports/cotizacion-provider.port.js';
import type { CotizacionProvider } from '../ports/cotizacion-provider.port.js';
import { COTIZACION_REPOSITORY } from '../ports/cotizacion-repository.port.js';
import type { CotizacionRepository } from '../ports/cotizacion-repository.port.js';

export interface ObtenerCotizacionVigenteInput {
  tipoCotizacionId: string;
}

export interface ObtenerCotizacionVigenteResultado {
  valor: number;
  fechaHora: Date;
  fuente: string;
  // true si la fuente externa falló y se devolvió la última cotización
  // cacheada — nunca se bloquea una venta por esto (ver
  // docs/ARQUITECTURA.md, sección "Offline / local-first").
  desdeCache: boolean;
}

@Injectable()
export class ObtenerCotizacionVigenteUseCase {
  constructor(
    @Inject(COTIZACION_PROVIDER)
    private readonly cotizacionProvider: CotizacionProvider,
    @Inject(COTIZACION_REPOSITORY)
    private readonly cotizacionRepository: CotizacionRepository,
  ) {}

  async ejecutar(input: ObtenerCotizacionVigenteInput): Promise<ObtenerCotizacionVigenteResultado> {
    const tipo = await this.cotizacionRepository.buscarTipoPorId(input.tipoCotizacionId);
    if (!tipo || !tipo.activo) {
      throw new TipoCotizacionInactivoError('El tipo de cotización no existe o está inactivo.');
    }

    try {
      const externo = await this.cotizacionProvider.obtenerValorActual(tipo.nombre);
      const cotizacion = Cotizacion.crear({
        id: randomUUID(),
        tipoCotizacionId: tipo.id,
        valor: externo.valor,
        fuente: externo.fuente,
        fechaHora: new Date(),
      });
      await this.cotizacionRepository.guardarCotizacion(cotizacion);

      return {
        valor: cotizacion.valor,
        fechaHora: cotizacion.fechaHora,
        fuente: cotizacion.fuente,
        desdeCache: false,
      };
    } catch {
      // Fuente externa caída (sin internet, DolarAPI/ArgentinaDatos abajo,
      // etc.) — seguimos operando con la última cotización cacheada en vez
      // de propagar el error.
      const ultima = await this.cotizacionRepository.buscarUltimaCotizacion(tipo.id);
      if (!ultima) {
        throw new CotizacionNoDisponibleError(
          'La fuente externa de cotización falló y no hay ninguna cotización cacheada.',
        );
      }

      return {
        valor: ultima.valor,
        fechaHora: ultima.fechaHora,
        fuente: ultima.fuente,
        desdeCache: true,
      };
    }
  }
}
