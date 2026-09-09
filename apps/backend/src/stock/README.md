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
  `StockRepository.obtenerStockActual` antes de persistir) y delega el resto
  de las invariantes a la entidad `Movimiento`. Soporta genéricamente
  compra/ajuste/transferencia/devolución porque la entidad ya los valida,
  pero **todavía no tiene tests para esos tipos** — eso es la próxima tarea
  de `TASKS.md` (extender + testear compra y ajuste explícitamente). Falta
  también `AjustarStock` como caso de uso propio si hace falta lógica extra
  sobre un `RegistrarMovimiento` de tipo `ajuste`.
- `infrastructure/` — **vacío todavía** (Stage 3): `PrismaStockRepository`,
  responsable de que registrar el movimiento y actualizar `stock.cantidad`
  pasen en la misma transacción.
- `presentation/` — **vacío todavía** (Stage 4).

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón.
