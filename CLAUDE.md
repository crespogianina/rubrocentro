# CLAUDE.md — Instrucciones para trabajar en este repo

Este archivo lo lee Claude Code automáticamente al arrancar en este directorio. Es la única vez que hace falta decir esto — no hace falta repetirlo en cada sesión.

## Antes de tocar código, en este orden

1. Leé **`docs/ARQUITECTURA.md`** completo. Es la fuente de verdad de todas las decisiones de arquitectura, modelo de datos, roles, cotizaciones, impresión, backup e instalación. Si algo en el código contradice ese documento, el documento gana — avisá antes de improvisar una alternativa.
2. Leé **`README.md`** para el resumen operativo (alcance del MVP, stack, convenciones, cómo levantar el entorno).
3. Leé **`TASKS.md`** y trabajá en orden de stage. No saltees al Stage 4 si el Stage 1 no está cerrado — el checklist está ordenado por dependencia a propósito, con los puntos de paralelización ya marcados.
4. Antes de empezar una tarea nueva de `TASKS.md`, marcá cuáles ítems del scaffold inicial ya están resueltos (hay una sección al principio de `TASKS.md` con lo ya hecho) para no rehacer trabajo.

## Reglas de arquitectura que no se negocian

- **Dirección de dependencias (backend, hexagonal):** `domain` no importa nada de `infrastructure` ni de Nest (ni decoradores, ni DI). `application` orquesta el `domain` exclusivamente a través de puertos (interfaces en `application/ports`). `infrastructure` implementa esos puertos (Prisma, HTTP externo, impresoras). `presentation` es la única capa que sabe que existe HTTP/Express — controllers, DTOs, guards. Un PR que rompa esta dirección no se mergea aunque los tests pasen. El módulo `src/catalogo/` está completo como ejemplo de referencia (entidad, puerto, caso de uso, test) — replicá ese patrón en los módulos que todavía son placeholders (`stock`, `compras`, `precios`, `cotizaciones`, `identidad`, `reportes`, `backups`).
- **Inmutabilidad donde el dominio lo exige:** `Movimiento`, `Venta`, `HistorialCotizacion` no se editan ni se borran — una corrección es una fila nueva que revierte o ajusta, nunca un `UPDATE`/`DELETE` sobre la original. `Precio` es una tabla versionada por vigencia, nunca un campo mutable en `Producto`/`Variante`. Ver `apps/backend/prisma/README.md` para el detalle de por qué.
- **Cotización del dólar:** el tipo de cotización se resuelve producto → categoría → default del sistema (nunca al revés), y una venta congela `tipoCotizacionId` + `valorCotizacionUsado` en `DetalleVenta` en el momento de la venta. No hay recálculo automático de precios cuando cambia la cotización — es una acción manual y auditada.
- **Roles y permisos:** autorización siempre del lado del backend (Guards contra el catálogo `rol_permiso`), nunca confiar en que el frontend oculte un botón. No implementar permisos granulares por usuario en el MVP — son roles fijos (Administrador, Encargado, Vendedor; Técnico queda para Fase 2).
- **No overengineering:** este es un sistema para un local de informática chico, no una plataforma multi-tenant. Si una tarea de `TASKS.md` te hace pensar "esto lo hago genérico por si algún día...", frená y preguntá antes de construir esa abstracción — la mayoría de esas decisiones ya se evaluaron y quedaron explícitamente para Fase 2/Fase 3/Futuro en `docs/ARQUITECTURA.md`.

## Desviación conocida respecto a `docs/ARQUITECTURA.md`

El documento de arquitectura menciona **Jest** como test runner. El scaffold generado por `@nestjs/cli` más reciente vino con **Vitest** + **oxlint** por defecto en `apps/backend`. Se decidió mantener los defaults del generador en vez de pelear contra ellos — es una diferencia de herramienta, no de decisión arquitectónica. `apps/frontend` (Angular) sí usa su test runner estándar (Karma/Jasmine por defecto del CLI de Angular, o Vitest si lo migrás — no se tocó). Si en algún momento se decide unificar en un solo runner para todo el monorepo, es una tarea de infraestructura de testing, no bloquea nada del Stage 2 en adelante.

## Estado del scaffold al día de hoy

Ya existe (no rehacer):

- Monorepo `pnpm workspaces` con `apps/backend`, `apps/frontend`, `apps/desktop`, `packages/shared-types`.
- `apps/backend`: NestJS scaffoldeado, `main.ts` con prefijo `/api/v1`, `ValidationPipe` global, Swagger en `/api/docs`, escuchando solo en `127.0.0.1`. `ConfigModule.forRoot({ isGlobal: true })` en `AppModule` carga `.env`. `PrismaService` con lifecycle hooks y driver adapter de SQLite (ver nota de Prisma 7 abajo). Schema completo de 31 modelos en `prisma/schema.prisma`, migrado y generado — `pnpm install` + `prisma migrate dev` + `prisma generate` ya se corrieron con éxito en este repo, `apps/backend/dev.db` existe (gitignored). Módulo `catalogo` completo como ejemplo (dominio + puerto + caso de uso + test); el resto de los módulos (`stock`, `compras`, `precios`, `cotizaciones`, `identidad`, `reportes`, `backups`) son carpetas placeholder con su propio `README.md` explicando qué va ahí y en qué Stage de `TASKS.md`.
- `apps/frontend`: Angular scaffoldeado (v19 del CLI, ver nota de versión de Node abajo), boilerplate de bienvenida ya removido, `environment.ts`/`environment.development.ts` apuntando a `http://127.0.0.1:3000/api/v1`.
- `apps/desktop`: Electron hand-armado (`main.ts`, `preload.ts`, `electron-builder.yml`), con el arranque del backend como proceso hijo marcado como TODO explícito — es la primera tarea real del Stage 8.
- `packages/shared-types`: algunos DTOs ilustrativos (`ProductoDTO`, `VarianteDTO`, `MovimientoDTO`, etc.) — no es una lista exhaustiva, ampliar a medida que se necesite.
- CI en GitHub Actions (`.github/workflows/ci.yml`) para backend y frontend — asume que ya existe un `pnpm-lock.yaml` commiteado (`--frozen-lockfile`), que todavía no existe.

**Entorno ya funcional** (a diferencia del sandbox donde se armó el scaffold original, acá la descarga de binarios de Prisma no está bloqueada). Si cloná el repo de nuevo:

```bash
pnpm install                                    # genera pnpm-lock.yaml — commitealo (scripts nativos preaprobados en pnpm-workspace.yaml)
cp apps/backend/.env.example apps/backend/.env  # completar JWT_SECRET
pnpm --filter backend exec prisma validate      # confirmar que el schema es válido
pnpm --filter backend exec prisma migrate dev --name init
pnpm --filter backend exec prisma generate
```

**Prisma 7 rompió compatibilidad respecto a lo que asume `docs/ARQUITECTURA.md`** (escrito para una versión anterior) — detalle completo en `apps/backend/prisma/README.md`, resumen: la URL de conexión se movió de `schema.prisma` a `apps/backend/prisma.config.ts`, el cliente en runtime necesita un driver adapter explícito (`@prisma/adapter-better-sqlite3`, ya cableado en `PrismaService` y `prisma/seed.ts`), y el seed se configura en `prisma.config.ts` en vez de `package.json`. También hubo que corregir versiones de `@nestjs/swagger`/`@nestjs/config`/`@nestjs/jwt` que en el scaffold original no soportaban Nest 12, y sumar `unplugin-swc` a los dos `vitest.config*.ts` — sin eso, la inyección de dependencias de Nest no funciona en los tests (esbuild no emite `emitDecoratorMetadata`; ver receta oficial de Nest para Vitest).

**Nota de versión de Node:** el frontend se generó con `@angular/cli@19` porque el sandbox tenía Node v22.22.2 y la versión `latest` del CLI de Angular exige v22.22.3+/24.15.0+/26.0.0+. Si tu máquina tiene una versión de Node más nueva, podés actualizar el CLI de Angular sin drama (`ng update @angular/cli @angular/core`) — no hay nada en el código que dependa de quedarse en v19.

## Convenciones (resumen — el detalle está en `README.md`)

- Ramas cortas `feature/nombre-de-la-tarea`, PR contra `main`, una tarea de `TASKS.md` ≈ un PR.
- `main` protegida, requiere que pase CI antes de mergear.
- Commits en modo imperativo.
- Marcá con `[x]` en `TASKS.md` cada ítem que termines — es el único tracking que este proyecto necesita mientras sea un solo desarrollador.
