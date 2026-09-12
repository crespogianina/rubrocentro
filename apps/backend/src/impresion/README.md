# Módulo `impresion`

Estado: **Stage 3 en curso** (TASKS.md) — puerto `ImpresoraPort` y
adaptador simulado listos.

No es uno de los módulos placeholder originales del scaffold (ver
CLAUDE.md) — `docs/ARQUITECTURA.md`, sección 26 "Sistema de impresión", lo
describe como "módulo de infraestructura propio" y Stage 3/9 de TASKS.md
efectivamente le piden entidad propia, así que se creó acá siguiendo la
misma estructura que `catalogo/`.

- `application/ports/impresora.port.ts` — `ImpresoraPort.imprimir(trabajo)`.
  `TrabajoImpresion` es el contenido ya renderizado a imprimir (snapshot,
  no se regenera con datos actuales — ver docs/ARQUITECTURA.md, "Operaciones
  críticas").
- `infrastructure/impresora-simulada.adapter.ts` — versión inicial: loguea
  el ticket (`Logger.log`) en vez de mandarlo a una impresora real, para no
  bloquear el resto del backend esperando hardware térmico/spooler.

Pendiente:

- Stage 7: caso de uso que arma el `TrabajoImpresion` a partir de
  `Comprobante.contenidoSnapshot` al confirmar una venta.
- Stage 9: adaptadores reales (ESC/POS por USB/serie, spooler de Windows
  para A4) implementando el mismo `ImpresoraPort` — nada que dependa del
  puerto debería cambiar. También la cola de trabajos persistida
  (`trabajo_impresion`) con reintentos y la pantalla de reintento manual.

No registrar este módulo en `app.module.ts` todavía — no hay ningún caso de
uso real que lo dispare hasta Stage 7.
