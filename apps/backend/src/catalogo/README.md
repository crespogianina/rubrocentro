# Módulo `catalogo`

Estado: **Stage 2 de TASKS.md en curso** — dominio y un primer caso de uso
(`CrearProducto`) con su test, como plantilla del patrón a repetir en el
resto de los módulos.

- `domain/` — entidades puras (`Producto`), sin dependencias de Nest ni Prisma.
- `application/` — puertos (interfaces) y casos de uso, testeados contra los
  puertos, no contra una base de datos real.
- `infrastructure/` — **vacío todavía** (Stage 3): acá va `PrismaProductoRepository`
  implementando `ProductoRepository`.
- `presentation/` — **vacío todavía** (Stage 4): acá van el controller, los
  DTOs y el `catalogo.module.ts` que junta todo y se registra en `AppModule`.

No registrar este módulo en `app.module.ts` hasta que `infrastructure/` y
`presentation/` existan — mientras tanto no hay nada que un módulo de Nest
pueda cablear de verdad.
