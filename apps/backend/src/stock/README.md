# Módulo `stock`

Estado: **Stage 2 de TASKS.md en curso** — entidad `Movimiento` y puerto
`StockRepository` listos; los casos de uso (`RegistrarMovimiento`,
`AjustarStock`) todavía no.

- `domain/` — `Movimiento`, entidad **inmutable** (ver CLAUDE.md): no
  expone ningún método que la modifique después de creada. Validaciones:
  variante/depósito/usuario obligatorios, cantidad > 0, y un `tipo: 'ajuste'`
  exige `motivo`.
- `application/ports/` — `StockRepository` (registrar movimiento, consultar
  stock actual por variante/depósito). El caso de uso no sabe si detrás hay
  SQLite, Postgres o un mock de test.
- `application/use-cases/` — **vacío todavía**: acá van `RegistrarMovimiento`
  (venta/compra/ajuste, con la regla "no vender más stock del disponible")
  y `AjustarStock`.
- `infrastructure/` — **vacío todavía** (Stage 3): `PrismaStockRepository`,
  responsable de que registrar el movimiento y actualizar `stock.cantidad`
  pasen en la misma transacción.
- `presentation/` — **vacío todavía** (Stage 4).

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón.
