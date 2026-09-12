# Módulo `cotizaciones`

Estado: **Stage 2 (dominio y casos de uso) cerrado.** Falta Stage 3
(infraestructura) — ver TASKS.md.

Catálogo de tipos de cotización + historial append-only + cliente de
DolarAPI.

- `domain/tipo-cotizacion.entity.ts` — catálogo (`oficial`, `blue`, `mep`,
  `ccl`, `mayorista`...).
- `domain/cotizacion.entity.ts` — fila de `historial_cotizacion`
  (append-only, nunca se edita ni se borra).
- `application/ports/cotizacion-provider.port.ts` — abstrae la fuente
  externa (DolarAPI, con ArgentinaDatos como respaldo).
- `application/ports/cotizacion-repository.port.ts` — persistencia del
  catálogo y del historial cacheado.
- `application/use-cases/obtener-cotizacion-vigente.use-case.ts` — consulta
  la fuente externa y cachea el resultado; si la fuente externa falla, cae
  a la última cotización cacheada en vez de bloquear (ver
  `docs/ARQUITECTURA.md`, sección "Offline / local-first").

Pendiente para Stage 3: `DolarApiCotizacionProvider` (implementación real
del puerto `CotizacionProvider`) y `PrismaCotizacionRepository`.
