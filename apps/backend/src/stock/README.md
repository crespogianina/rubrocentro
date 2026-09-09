# Módulo `stock`

Estado: **Stage 2 de TASKS.md en curso** — entidad `Movimiento`, puerto
`StockRepository` y caso de uso `RegistrarMovimiento` (venta) listos.

- `domain/` — `Movimiento`, entidad **inmutable** (ver CLAUDE.md): no
  expone ningún método que la modifique después de creada. Validaciones:
  variante/depósito/usuario obligatorios, cantidad > 0, y un `tipo: 'ajuste'`
  exige `motivo`.
- `application/ports/` — `StockRepository` (registrar movimiento, consultar
  stock actual por variante/depósito). El caso de uso no sabe si detrás hay
  SQLite, Postgres o un mock de test.
- `application/use-cases/` — `RegistrarMovimiento`: valida "no vender más
  stock del disponible" cuando `tipo === 'venta'` (consulta
  `StockRepository.obtenerStockActual` antes de persistir); `compra` no
  consulta stock (siempre suma) y `ajuste` delega en la entidad `Movimiento`
  la exigencia de motivo — los tres tipos tienen test. `transferencia` y
  `devolucion` quedan soportados genéricamente (la entidad no les exige nada
  extra) pero sin caso de uso/test dedicado todavía porque no hay una
  pantalla del MVP que los dispare aún. Falta `AjustarStock` como caso de
  uso propio si hace falta lógica extra (por ejemplo, resolver el signo del
  ajuste) sobre un `RegistrarMovimiento` de tipo `ajuste`.
- `infrastructure/` — **vacío todavía** (Stage 3): `PrismaStockRepository`,
  responsable de que registrar el movimiento y actualizar `stock.cantidad`
  pasen en la misma transacción.
- `presentation/` — **vacío todavía** (Stage 4).

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón.
