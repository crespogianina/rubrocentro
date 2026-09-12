# Módulo `cotizaciones`

Estado: **Stage 2 (dominio y casos de uso) cerrado.** Stage 3 en curso:
`DolarApiCotizacionProvider` ya implementado; falta `PrismaCotizacionRepository`.

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

- `infrastructure/dolarapi-cotizacion.provider.ts` — implementación real de
  `CotizacionProvider`: DolarAPI (`GET {DOLAR_API_URL}/dolares/{casa}`) como
  fuente primaria, ArgentinaDatos (`GET
  https://api.argentinadatos.com/v1/cotizaciones/dolares/{casa}`, tomando
  el último elemento de la serie histórica) como respaldo si la primera
  falla o responde con error. Usa el valor de **venta**. Traduce el
  catálogo `tipo_cotizacion.nombre` a la "casa" de la URL externa (difieren
  para `mep` → `bolsa` y `ccl` → `contadoconliqui`). Timeout de 5s por
  request vía `AbortController`. Tests con `fetch` mockeado (`vi.stubGlobal`),
  sin red real.

Pendiente para Stage 3: `PrismaCotizacionRepository`.
