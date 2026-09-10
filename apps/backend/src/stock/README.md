# Módulo `stock`

Estado: **Stage 2 de TASKS.md cerrado** — entidad `Movimiento`, puerto
`StockRepository` y casos de uso `RegistrarMovimiento` y `AjustarStock`
listos.

- `domain/` — `Movimiento`, entidad **inmutable** (ver CLAUDE.md): no
  expone ningún método que la modifique después de creada. Validaciones:
  variante/depósito/usuario obligatorios, cantidad > 0 (siempre magnitud,
  nunca con signo), y `tipo: 'ajuste_alta' | 'ajuste_baja'` exige `motivo`.
  `tipo` se modela como dos valores separados para alta/baja de ajuste en
  vez de un campo `direccion` aparte — no requiere migración porque `tipo`
  ya es un `String` libre en el schema, no un enum de Prisma.
- `application/ports/` — `StockRepository` (registrar movimiento, consultar
  stock actual por variante/depósito). El caso de uso no sabe si detrás hay
  SQLite, Postgres o un mock de test.
- `application/use-cases/`:
  - `RegistrarMovimiento` — valida "no restar más stock del disponible"
    cuando `tipo` es `'venta'` o `'ajuste_baja'` (consulta
    `StockRepository.obtenerStockActual` antes de persistir); `compra` y
    `ajuste_alta` no consultan stock (siempre suman). El resto de las
    invariantes (motivo en ajustes, cantidad > 0) las resuelve la entidad
    `Movimiento`. `transferencia` y `devolucion` quedan soportados
    genéricamente pero sin caso de uso/test dedicado todavía porque no hay
    una pantalla del MVP que los dispare aún.
  - `AjustarStock` — wrapper fino sobre `RegistrarMovimiento` pensado para
    la pantalla de ajuste manual (Stage 6): traduce una entrada explícita
    `direccion: 'alta' | 'baja'` al `tipo` de movimiento correspondiente.
- `infrastructure/` — **vacío todavía** (Stage 3): `PrismaStockRepository`,
  responsable de que registrar el movimiento y actualizar `stock.cantidad`
  pasen en la misma transacción.
- `presentation/` — **vacío todavía** (Stage 4).

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón.
