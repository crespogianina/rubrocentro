# TASKS — RubroCero, Fase 1 (MVP)

Checklist de trabajo dividido en stages, y cada stage en tareas chicas (pensadas para completarse en una sentada y terminar en un PR). Marcá con `[x]` a medida que avanzás — es el rastro más simple posible, y si más adelante sumás a alguien más al proyecto, cada ítem se puede pasar a un Issue de GitHub sin reescribir nada.

**Orden:** los stages están ordenados por dependencia — no hace falta terminar un stage al 100% para arrancar el siguiente en varios casos (se marca dónde se puede paralelizar), pero seguir el orden general evita construir sobre algo que todavía no existe.

**Nota:** este repo ya tiene un scaffold inicial armado (ver `CLAUDE.md` para el detalle completo). Los ítems marcados `[x]` abajo ya están resueltos por ese scaffold — revisalos igual antes de asumir que están 100% terminados, en particular los marcados con 🔶 (parcial).

---

## Stage 0 — Repositorio y monorepo

- [x] Crear repositorio privado en GitHub (`crespogianina/rubrocentro`)
- [ ] Proteger la rama `main` (require PR + CI antes de mergear)
- [x] Inicializar monorepo con `pnpm workspaces` (`pnpm-workspace.yaml` con `apps/*` y `packages/*`)
- [x] Crear `packages/shared-types` (con algunos DTOs ilustrativos, no exhaustivos)
- [ ] 🔶 Configurar ESLint + Prettier compartidos en la raíz — cada app trae su propio linter del generador (oxlint en backend, ESLint en frontend); unificar en la raíz queda pendiente, no es bloqueante
- [x] Crear workflow de GitHub Actions: lint + test en backend, build en frontend, en cada push (`.github/workflows/ci.yml`) — necesita `pnpm-lock.yaml` commiteado para que `--frozen-lockfile` funcione
- [x] Agregar este `README.md`, `TASKS.md` y `CLAUDE.md` al repo
- [x] Crear `.gitignore` (node_modules, dist, `.env`, `*.db`, `apps/desktop/release`)
- [x] `git init` + primer commit

## Stage 1 — Base de datos (schema completo antes de tocar código de negocio)

- [x] Crear `apps/backend` con NestJS (`nest new`)
- [x] Instalar y configurar Prisma dentro de `apps/backend` — `pnpm install`, `prisma validate`/`migrate dev`/`generate` corridos con éxito; requirió adaptar el schema y agregar `prisma.config.ts` a la arquitectura de Prisma 7 (ver `apps/backend/prisma/README.md`, sección "Prisma 7 — cambios de configuración")
- [x] Definir en `schema.prisma`: `categoria` (jerárquica), `marca`, `producto`, `atributo`, `variante`, `deposito`, `stock`, `movimiento`
- [x] Definir: `rol`, `permiso`, `rol_permiso`, `usuario`
- [x] Definir: `proveedor`, `compra`, `detalle_compra`, `cliente`, `venta`, `detalle_venta`, `metodo_pago`, `pago`
- [x] Definir: `precio` (con vigencia — no un campo mutable), `lista_precio`
- [x] Definir: `tipo_cotizacion`, `historial_cotizacion`
- [x] Definir: `comprobante`, `trabajo_impresion`, `auditoria`, `configuracion_negocio`, `backup_log`
- [x] Primera migración (`prisma migrate dev`) y revisión manual del `.sql` generado — hecha; se corrigió un bug de Prisma 7.10.0 (default de `Json` sin comillas) y se agregó a mano el índice único parcial de `precio` (ver `apps/backend/prisma/README.md`)
- [x] Script de seed con datos de ejemplo realistas — `prisma/seed.ts` carga roles/permisos (4 roles, 11 permisos), usuario admin, 6 categorías (con jerarquía), 5 marcas, 1 depósito, 5 tipos de cotización, 4 métodos de pago y 10 productos/13 variantes con stock inicial; todo idempotente (upsert por clave de negocio o id fijo)
- [x] Documentar en `apps/backend/prisma/README.md` cualquier decisión de modelado que no sea obvia mirando el schema

*Este stage se beneficia de estar 100% resuelto antes de seguir — cambiar el schema a mitad del Stage 2 en adelante genera migraciones desprolijas.*

## Stage 2 — Backend: dominio y casos de uso (sin HTTP, sin Prisma real todavía)

*Orden sugerido: catalogo (cerrar) → stock → identidad → cotizaciones. Son
paralelizables entre sí si en algún momento hay más de una persona
trabajando. El módulo `catalogo` es la plantilla concreta del patrón
domain/application/ports/use-cases — copiá esa estructura en el resto.*

### Catalogo (cerrado)

- [x] `Variante` (entidad de dominio) y el puerto `VarianteRepository`
      (`src/catalogo/domain/variante.entity.ts`,
      `src/catalogo/application/ports/variante-repository.port.ts`)
- [x] Caso de uso `CrearProducto` + unit tests
- [x] Caso de uso `CrearVariante` (valida producto existente vía
      `ProductoRepository.buscarPorId`, SKU único vía `existeSku`) + unit
      tests — mismo patrón que `CrearProducto`

### Stock

- [x] Entidad `Movimiento` (inmutable — ver regla de no-UPDATE/DELETE en
      CLAUDE.md) + puerto `StockRepository` (registrar movimiento, consultar
      stock actual por variante/depósito) — sin caso de uso todavía, PR base
- [x] Caso de uso `RegistrarMovimiento` para venta, con la validación "no
      permitir vender más stock del disponible" + unit tests
- [x] Extender `RegistrarMovimiento` para compra y ajuste + unit tests
- [x] Caso de uso `AjustarStock` (manual, motivo obligatorio) + unit tests

### Identidad

- [x] Funciones puras testeables: hash de contraseña (argon2) y
      generación/validación de JWT — sin caso de uso todavía, PR base
- [x] Puerto `UsuarioRepository` + caso de uso `AutenticarUsuario`
      (valida usuario/contraseña, emite JWT) + unit tests

### Cotizaciones

- [x] Puerto `CotizacionProvider` + value object/entidad para tipo de
      cotización — PR base
- [x] Caso de uso `ObtenerCotizacionVigente`, con fallback a la última
      cotización cacheada si falla la fuente externa + unit tests

## Stage 3 — Backend: infraestructura (los adaptadores)

- [x] `PrismaProductoRepository` implementando el puerto de Stage 2 + integration tests contra SQLite de prueba
- [x] `PrismaStockRepository` + integration tests (probar la transacción real: baja de stock + alta de movimiento juntas)
- [x] `PrismaUsuarioRepository`
- [x] `DolarApiCotizacionProvider` (cliente HTTP a DolarAPI/ArgentinaDatos) + su test con la respuesta mockeada
- [x] Adaptador de impresión — versión inicial simulada (loguea el ticket en vez de imprimir de verdad, para no bloquearse esperando el hardware)

*Stage 3 completo. `src/impresion/` es un módulo nuevo, no estaba en la
lista de placeholders original del scaffold — ver su `README.md` para el
porqué.*

## Stage 4 — Backend: presentación (la API REST)

- [ ] Controller de `catalogo` (productos/variantes) + DTOs + Pipes de validación
- [ ] Controller de `stock` (movimientos)
- [x] Controller de `identidad` (login) + Guard de autenticación (JWT)
- [ ] Guard de permisos (por rol, contra el catálogo `rol_permiso`)
- [x] Filtro global de errores (excepciones de dominio → respuesta HTTP consistente)
- [x] Interceptor de logging
- [x] Swagger/OpenAPI en `/api/docs` — configurado en `main.ts`
- [x] Prefijo de versión `/api/v1` en todas las rutas — configurado en `main.ts`

*Los ítems marcados `[ ]` de este stage ya están resueltos en ramas
separadas pendientes de merge: `feature/catalogo-controller`,
`feature/stock-controller`, `feature/guard-permisos`.*

## Stage 5 — Frontend: base

- [x] Crear `apps/frontend` con Angular
- [ ] Layout base: shell, menú lateral, header
- [ ] Pantalla de login
- [ ] `AuthService` + `AuthGuard` + `RoleGuard`
- [ ] `TokenInterceptor` + `ErrorInterceptor`
- [ ] Servicio HTTP genérico apuntando a `environment.apiUrl` (ya está configurado el `apiUrl` en `environment.ts`/`environment.development.ts`, falta el servicio)

## Stage 6 — Primer feature de punta a punta (plantilla del resto)

- [ ] Pantalla de productos: listar, crear, editar (conectada a la API real de Stage 4)
- [ ] Pantalla de stock por depósito (consulta + ajuste manual)
- [ ] Retrospectiva corta: ¿el patrón usado acá sirve para replicar en ventas/compras sin fricción? Ajustar antes de seguir si no.

## Stage 7 — Resto de features (paralelizable entre sí una vez validado el Stage 6)

- [ ] Ventas: carrito, confirmar venta (transacción completa), pantalla de historial
- [ ] Anulación y devolución de ventas
- [ ] Compras y proveedores
- [ ] Clientes (alta básica desde el flujo de venta)
- [ ] Cotizaciones: barra inferior persistente + sección de consulta/historial
- [ ] Recalculo de precios sugeridos por categoría/proveedor (manual, con confirmación)
- [ ] Reportes básicos: valorización de stock, más vendidos

## Stage 8 — Empaquetado de escritorio

- [x] Crear `apps/desktop` con Electron
- [x] `preload.ts` con `contextBridge` (contextIsolation activado, nodeIntegration desactivado)
- [ ] Electron levanta el backend NestJS como proceso hijo al iniciar — hay un stub `startBackend()` con los TODO marcados, falta la implementación real (spawn del build compilado, esperar a que levante antes de crear la ventana)
- [x] 🔶 Configurar `electron-builder` (instalador NSIS para Windows) — `electron-builder.yml` armado, falta completar owner/repo de GitHub Releases y el certificado de firma de código
- [ ] Acceso directo en la carpeta de Inicio de Windows (auto-arranque)
- [ ] Configurar `electron-updater` contra GitHub Releases (la dependencia ya está instalada, falta la lógica)

## Stage 9 — Impresión real

- [ ] Reemplazar el adaptador simulado de Stage 3 por impresión térmica real (ESC/POS vía USB)
- [ ] Adaptador de impresora convencional (spooler de Windows) para comprobantes A4
- [ ] Cola de impresión persistida (`trabajo_impresion`) con reintentos
- [ ] Pantalla de "trabajos de impresión con error" + botón reintentar

## Stage 10 — Backup

- [ ] Backup local automático diario (copia del archivo SQLite + `PRAGMA integrity_check`)
- [ ] Subida automática a Drive/OneDrive (o carpeta sincronizada) o a Backblaze
- [ ] Registro en `backup_log` + indicador visible en el dashboard ("último backup: hace X hs ✓")
- [ ] Pantalla de restauración de backup

## Stage 11 — Testing E2E y cierre de MVP

- [ ] Playwright: flujo completo de venta (login → vender → imprimir → ver en historial)
- [ ] Playwright: flujo de compra y ajuste de stock
- [ ] Playwright: backup y restauración
- [ ] Asistente de instalación inicial (crear Admin, configurar negocio/impresoras/backup) dentro de la app
- [ ] Documentación de instalación para el cliente final (aparte de este repo, es para entregar)

---

## Seguridad — hallazgos de auditoría (2026-09-12)

Ítems que surgieron de una revisión de seguridad puntual sobre el scaffold actual, no de un stage planeado de antemano. Se agregan acá para no perder el rastro; no reordenan los stages de arriba ni bloquean seguir con Stage 2 en adelante.

- [x] Usuario admin del seed con contraseña conocida (`admin123`) y sin forzar cambio en el primer login — reemplazado por una contraseña aleatoria generada en `prisma/seed.ts`, logueada una sola vez por consola. El "forzar cambio en el primer login" completo (flag en `Usuario` + pantalla) queda para cuando exista login real (Stage 4/5) — no adelantarlo sin ese caso de uso.
- [x] Sin validación de variables de entorno al arrancar — agregado `src/config/env.validation.ts`, conectado en `AppModule` vía `ConfigModule.forRoot({ validate })`: el backend no levanta si `JWT_SECRET` falta, es corto o quedó igual al placeholder de `.env.example`, ni si falta `DATABASE_URL`/`DOLAR_API_URL`/`JWT_EXPIRES_IN` con formato inválido.
- [ ] Dependencias con vulnerabilidades conocidas (`pnpm audit --prod`: 11 high, 5 moderate, 1 low) — Angular ≤19.2.25 (XSS vía atributos de eventos i18n, DoS por OOM en `formatDate`, envenenamiento de `HttpTransferCache`) y `multer` <2.3.0 (3 DoS, vía `@nestjs/platform-express`). Acción: `ng update @angular/core @angular/cli`, forzar resolución de `multer` a `>=2.3.0`, commitear `pnpm-lock.yaml` actualizado.
- [ ] Sin `pnpm audit` ni Dependabot en CI — `docs/ARQUITECTURA.md` §18 ya lo marca como "necesario ahora" pero `.github/workflows/ci.yml` no lo corre y no existe `.github/dependabot.yml`.

## Fuera de esta lista (a propósito)

Rol Técnico y servicio técnico, impresión de comprobantes A4, importador CSV, multi-terminal, ARCA — están en Fase 2/3 del documento de arquitectura, no en este checklist. Agregarlos acá antes de tiempo es la forma más fácil de no terminar nunca la Fase 1.
