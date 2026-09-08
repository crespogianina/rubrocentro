# Notas del schema

Decisiones que no son obvias mirando `schema.prisma` a simple vista (ver
docs/ARQUITECTURA.md para el porqué completo de cada una):

- **`movimiento`, `venta` y `historial_cotizacion` son inmutables a propósito** —
  sin `updatedAt` ni `deletedAt`. Un error se corrige con una fila nueva
  (un movimiento inverso, una venta anulada + reversión), nunca editando o
  borrando la original.
- **`precio` es una tabla versionada**, no un campo mutable en `producto` —
  cada cambio de precio es una fila nueva con `vigenteDesde`/`vigenteHasta`.
  Falta agregar a mano, en la primera migración, un índice único parcial
  (Prisma todavía no lo expone en el schema):
  ```sql
  CREATE UNIQUE INDEX precio_activo_unico ON precio(lista_precio_id, variante_id)
  WHERE vigente_hasta IS NULL;
  ```
- **`rol`/`permiso`/`rol_permiso` son catálogos**, no un enum de rol en
  código — el seed carga 4 roles fijos (admin/encargado/vendedor/tecnico)
  para el MVP, pero agregar uno nuevo más adelante es una fila, no una
  migración de esquema.
- **`tipo_cotizacion` es un catálogo abierto** (oficial/blue/mep/ccl/mayorista),
  no un enum de 2 valores — `historial_cotizacion` es append-only.
- **`categoria` es jerárquica** (`categoriaPadreId`, auto-relación) y puede
  definir un `tipoCotizacionDefaultId` que `producto.tipoCotizacionId`
  puede pisar puntualmente.
- Los enums de negocio (`tipo` de movimiento, `estado` de venta, etc.) se
  modelaron como `String` con un comentario al lado, no como `enum` de
  Prisma — el conector de SQLite no soporta `enum` nativo; se valida en la
  capa de aplicación (DTOs con `class-validator`).
- **Índice único parcial en `precio`** (`precio_activo_unico`, solo un precio
  activo por `lista_precio_id` + `variante_id` con `vigente_hasta IS NULL`):
  Prisma no expresa índices parciales en `schema.prisma`, así que está
  agregado a mano al final de `migrations/20260908002804_init/migration.sql`.
  Si en algún momento se resetea/regenera esa migración inicial, hay que
  volver a agregar esa línea.

## Prisma 7 — cambios de configuración (ya resueltos en este repo)

El paquete `prisma` está pinneado en `7.10.0`, que rompió compatibilidad
respecto a lo que documenta `docs/ARQUITECTURA.md` (escrito pensando en una
versión anterior). Lo que cambió y cómo quedó resuelto:

- **La URL de conexión ya no va en `datasource.url` de `schema.prisma`** —
  ahora vive en `apps/backend/prisma.config.ts` (`datasource.url`, vía
  `env('DATABASE_URL')`), que además carga `.env` a mano con
  `import 'dotenv/config'` (Prisma ya no lo hace automáticamente).
- **El cliente en runtime necesita un driver adapter explícito** — no alcanza
  con `new PrismaClient()`. Se usa `@prisma/adapter-better-sqlite3` tanto en
  `PrismaService` (`src/prisma/prisma.service.ts`) como en `prisma/seed.ts`.
  Cualquier lugar nuevo que instancie `PrismaClient` directamente (no
  debería hacer falta — todo pasa por `PrismaService`) necesita el mismo
  adapter.
- **El seed ya no se configura en `package.json`** (`"prisma": {"seed": ...}`)
  sino en `prisma.config.ts` (`migrations.seed`).
- **Bug conocido de esta versión (7.10.0):** un campo `Json` con
  `@default("{}")` generaba `DEFAULT {}` sin comillas en la migración de
  SQLite (SQL inválido, falla `migrate dev`). Por eso `Variante.atributos`
  no tiene `@default` en el schema — el valor por defecto lo pone la capa de
  aplicación al crear la variante (Stage 2, caso de uso `CrearVariante`).

## Validar el schema

Ya se corrió con éxito en este repo (`pnpm install` desde la raíz, después
`pnpm --filter backend exec prisma validate/migrate dev/generate`) — los 31
modelos migran limpio a `apps/backend/dev.db` (SQLite, gitignored). Si hace
falta repetirlo desde cero:

```bash
pnpm install                                       # desde la raíz
cd apps/backend
cp .env.example .env   # completar JWT_SECRET
pnpm exec prisma validate
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

Si algo no valida, es más probable que sea un error de tipeo puntual que un
problema del modelo en sí — el diseño está documentado en detalle en
`docs/ARQUITECTURA.md`.
