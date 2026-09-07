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

## Validar el schema

Este archivo se escribió y se revisó a mano (balance de llaves, relaciones
cruzadas, nombres duplicados), pero **no se pudo correr `prisma validate`
ni `prisma generate`** en el entorno donde se generó este scaffold —
el proxy de salida de ese entorno bloqueaba la descarga de los binarios de
Prisma. Lo primero para hacer en una máquina con internet normal:

```bash
cd apps/backend
pnpm install
pnpm exec prisma validate
pnpm exec prisma migrate dev --name init
```

Si algo no valida, es más probable que sea un error de tipeo puntual que un
problema del modelo en sí — el diseño está documentado en detalle en
`docs/ARQUITECTURA.md`.
