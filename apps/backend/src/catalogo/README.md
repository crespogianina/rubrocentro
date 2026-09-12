# Módulo `catalogo`

Estado: **Stage 2 cerrado** (dominio y casos de uso — `CrearProducto`,
`CrearVariante`, plantilla del patrón a repetir en el resto de los
módulos). **Stage 3 en curso**: `PrismaProductoRepository` ya implementado
para `Producto`; falta el equivalente para `Variante`.

- `domain/` — entidades puras (`Producto`, `Variante`), sin dependencias de Nest ni Prisma.
- `application/` — puertos (interfaces) y casos de uso, testeados contra los
  puertos, no contra una base de datos real.
- `infrastructure/` — `PrismaProductoRepository` (con integration tests
  contra un SQLite de prueba, ver `apps/backend/test/prisma-test-db.ts`).
  Falta `PrismaVarianteRepository`.
- `presentation/` — **vacío todavía** (Stage 4): acá van el controller, los
  DTOs y el `catalogo.module.ts` que junta todo y se registra en `AppModule`.

No registrar este módulo en `app.module.ts` hasta que `presentation/`
exista — mientras tanto no hay nada que un módulo de Nest pueda cablear de
verdad.
