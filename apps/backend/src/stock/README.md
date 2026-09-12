# Módulo `stock`

Estado: **Stage 2 y 3 cerrados**. **Stage 4 (el ítem de este módulo)
cerrado**: solo se expone el ajuste manual, ver `presentation/` abajo.

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
- `infrastructure/` — `PrismaStockRepository`: registra el movimiento y
  actualiza `stock.cantidad` (upsert con `increment`/`decrement`) en la
  misma transacción Prisma — si el tipo de movimiento no tiene delta de
  stock definido (hoy: `transferencia`), revierte también el movimiento ya
  insertado. Integration tests contra el SQLite de prueba compartido
  (`apps/backend/test/prisma-test-db.ts`, el mismo helper de `catalogo`).
- `presentation/` — `StockController`: solo `POST /api/v1/stock/ajustes`
  (`AjustarStockUseCase`), protegido con `JwtAuthGuard` +
  `@RequierePermiso('stock:ajustar')`. `usuarioId` sale del JWT
  (`request.usuarioAutenticado.sub`), nunca del body — evita que alguien
  registre un ajuste "a nombre de" otro usuario. A propósito **no** se
  expone `RegistrarMovimiento` genérico (venta/compra/transferencia) vía
  HTTP todavía: no hay controller de ventas/compras (Stage 7) que lo
  necesite como caller real, y no hay un permiso en `prisma/seed.ts` que
  module ese endpoint por tipo de movimiento — exponerlo suelto dejaría que
  cualquier usuario autenticado infle stock arbitrariamente. Se agrega
  cuando ventas/compras lo llamen internamente.

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón.
