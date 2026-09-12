// Puerto (interfaz) — ver docs/ARQUITECTURA.md, sección 26 "Sistema de
// impresión": ImpresoraPort con adaptadores térmico (ESC/POS) y
// convencional (spooler de Windows), Stage 9 de TASKS.md. Por ahora
// (Stage 3) solo existe el adaptador simulado — loguea el ticket en vez de
// imprimir de verdad, para no bloquearse esperando el hardware.
//
// `contenido` es el snapshot ya renderizado a imprimir (texto plano para
// térmica) — quien arma ese contenido (a partir de `Comprobante.contenidoSnapshot`)
// es responsabilidad de un caso de uso de Stage 7 (confirmar venta),
// todavía no existe.
export interface TrabajoImpresion {
  comprobanteId: string;
  tipo: string; // 'ticket_venta' | 'presupuesto' | 'orden_servicio' ...
  contenido: string;
}

export interface ImpresoraPort {
  imprimir(trabajo: TrabajoImpresion): Promise<void>;
}

export const IMPRESORA_PORT = Symbol('ImpresoraPort');
