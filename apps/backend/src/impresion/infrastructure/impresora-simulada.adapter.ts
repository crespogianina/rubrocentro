import { Injectable, Logger } from '@nestjs/common';
import type { ImpresoraPort, TrabajoImpresion } from '../application/ports/impresora.port.js';

// Adaptador de infraestructura — versión inicial simulada (Stage 3 de
// TASKS.md): loguea el ticket en vez de mandarlo a una impresora real, para
// no bloquear el resto del backend esperando hardware térmico/spooler.
// Stage 9 lo reemplaza por los adaptadores reales (ESC/POS, spooler de
// Windows) implementando el mismo puerto `ImpresoraPort` — nada que use
// este adaptador debería cambiar cuando eso pase.
@Injectable()
export class ImpresoraSimuladaAdapter implements ImpresoraPort {
  private readonly logger = new Logger(ImpresoraSimuladaAdapter.name);

  async imprimir(trabajo: TrabajoImpresion): Promise<void> {
    this.logger.log(
      `[IMPRESIÓN SIMULADA] comprobante=${trabajo.comprobanteId} tipo=${trabajo.tipo}\n${trabajo.contenido}`,
    );
  }
}
