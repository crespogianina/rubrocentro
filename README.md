# RubroCero

Sistema de gestión de stock y ventas para un local de informática, con una base genérica pensada para poder instalarse en otros rubros/comercios más adelante (ver análisis completo más abajo).

> Nombre de trabajo. Si más adelante definís un nombre comercial, es solo cuestión de renombrar el repo y el `name` de los `package.json` — no hay nada más atado a "RubroCero" en el código.

## Estado actual

**Fase 0 — Análisis y arquitectura: ✅ completa.**
**Fase 1 — MVP: 🔨 scaffold inicial creado, desarrollo no arrancado.** Ver [`CLAUDE.md`](./CLAUDE.md) para el estado exacto de qué ya existe en el repo, y [`TASKS.md`](./TASKS.md) para el checklist tarea por tarea.

Todo el análisis que sustenta las decisiones de este documento (mercado, arquitectura, modelo de datos completo, roles, cotizaciones, impresión, backup, instalación) está condensado en [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md), con la versión completa y con formato en:

📄 **[Documento de arquitectura completo (RubroCero)](https://claude.ai/code/artifact/162f2771-1a34-447b-9900-475ccdf400a8)**

Ante cualquier duda de diseño durante el desarrollo, esa es la fuente de verdad. Este README es el resumen operativo para poder arrancar a codear sin tener que releerlo entero. Si estás usando Claude Code sobre este repo, ya lee `CLAUDE.md` automáticamente al arrancar — no hace falta pegarle este contexto a mano.

## Qué se implementa (alcance del MVP — Fase 1)

- Catálogo: productos, categorías (jerárquicas), marcas, atributos configurables por categoría, variantes
- Stock: un depósito por instalación, movimientos (venta/compra/ajuste), alertas de stock mínimo
- Ventas: carrito, múltiples métodos de pago, impresión de ticket térmico, anulación y devolución
- Compras y proveedores
- Clientes (datos básicos)
- Cotización del dólar: catálogo de tipos (oficial/blue/MEP/CCL/mayorista), consulta e historial, sin recálculo automático de precios
- Usuarios y roles: Administrador, Encargado, Vendedor (Técnico y servicio técnico completo quedan para Fase 2)
- Autenticación por usuario/contraseña, sesión con JWT
- Backup automático 3-2-1 (local + nube) con verificación de integridad
- Auditoría de operaciones sensibles (precios, anulaciones, ajustes de stock, usuarios)
- Empaquetado como instalador de escritorio para Windows, con auto-actualización

## Qué NO se implementa todavía (a propósito)

- Rol Técnico y módulo de servicio técnico completo → Fase 2
- Impresión de comprobantes convencionales (A4) → Fase 2
- Importador de productos por CSV → Fase 2
- Multi-terminal / backend como servicio de Windows → Fase 3, condicional
- Facturación electrónica ARCA/AFIP → Fase 3, condicional
- Multi-tenant / SaaS → no planificado, ver `docs/ARQUITECTURA.md` sección "Uso propio, producto o SaaS"

El detalle tarea por tarea de la Fase 1 está en [`TASKS.md`](./TASKS.md).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular |
| Backend | NestJS (Node/TypeScript) |
| ORM / Base de datos | Prisma + SQLite (Postgres el día que haga falta) |
| Escritorio | Electron + electron-builder + electron-updater |
| Testing backend | Vitest (unit/integration) — el scaffold de NestJS 12 lo trae por defecto; ver nota en `CLAUDE.md` sobre la mención a Jest en el documento de arquitectura |
| Testing E2E | Playwright |
| Monorepo | pnpm workspaces |

**Por qué pnpm workspaces y no Nx/Turborepo:** con 3 apps (`backend`, `frontend`, `desktop`) y un paquete compartido, herramientas de orquestación de monorepo grandes (Nx) suman configuración y curva de aprendizaje sin un problema real que resolver todavía. Si el build se vuelve lento a medida que el proyecto crece, Turborepo es la próxima escala natural — no antes.

## Herramientas necesarias para desarrollo

- **Node.js** 22 LTS (o superior — ver nota de versión en `CLAUDE.md` si usás una más nueva)
- **pnpm** (`npm install -g pnpm`)
- **Git**
- **VS Code** (recomendado) con extensiones: Prisma, ESLint, Angular Language Service
- **DB Browser for SQLite** — para inspeccionar la base local a mano durante el desarrollo
- Cliente HTTP para probar la API a mano: alcanza con el Swagger UI que expone NestJS (`/api/docs`), no hace falta Postman/Insomnia aparte
- **GitHub CLI** (`gh`) — opcional, cómodo para crear PRs desde la terminal

## Repositorio

**Recomendación: GitHub, repositorio privado, en tu cuenta personal** (no hace falta una organización todavía — no hay ni un segundo desarrollador ni un cliente pagando). Si más adelante el proyecto se convierte en un producto con más gente involucrada, transferir un repo de una cuenta personal a una organización en GitHub es una operación de un clic, sin perder historial ni issues.

Este scaffold todavía **no es un repositorio git** (no se corrió `git init` — se armó en un entorno sin credenciales para crear/pushear un repo real). Es el primer paso de `TASKS.md` Stage 0.

Configuración mínima recomendada desde el día uno:
- Rama `main` protegida (no permitir push directo, exigir que pase CI antes de mergear) — aunque estés vos solo, te obliga a pasar por PR y CI, que es justo el hábito que evita bugs tontos en producción.
- **GitHub Actions** para CI: ya hay un workflow armado en `.github/workflows/ci.yml` (lint + test en backend, build en frontend) — corre en cada push. Necesita que exista `pnpm-lock.yaml` commiteado (`pnpm install` lo genera la primera vez).
- **GitHub Projects** (el tablero Kanban integrado, gratis) alimentado por Issues — una forma natural de no perder el rastro sin sumar otra herramienta. Cada ítem de `TASKS.md` se puede convertir en un Issue cuando lo empezás a trabajar; no hace falta crearlos todos de entrada.

## Cómo se arranca el entorno

```bash
git init && git add . && git commit -m "scaffold inicial"
# (o) git clone <url-del-repo-ya-creado-en-github> y copiá el contenido

pnpm install   # genera pnpm-lock.yaml — commitealo (los scripts nativos de prisma/argon2/better-sqlite3/electron ya están preaprobados en pnpm-workspace.yaml)

# Backend (API local en NestJS)
cp apps/backend/.env.example apps/backend/.env   # y completá JWT_SECRET
pnpm --filter backend exec prisma validate        # primera vez: confirmar que el schema es válido
pnpm --filter backend exec prisma migrate dev --name init
pnpm backend:dev                                   # levanta la API en http://127.0.0.1:3000

# Frontend (Angular, apuntando a la API de arriba)
pnpm frontend:dev

# Todo junto dentro de Electron (una vez armado el arranque del backend en apps/desktop — Stage 8)
pnpm desktop:dev
```

Variables de entorno del backend (`apps/backend/.env`, nunca commiteado — ver `.env.example`):

```
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=<generar uno para desarrollo, distinto al de producción>
JWT_EXPIRES_IN=45m
DOLAR_API_URL=https://dolarapi.com/v1
```

## Estructura del proyecto

```
rubrocero/
├── CLAUDE.md         # instrucciones para Claude Code — leer antes de tocar código
├── docs/
│   └── ARQUITECTURA.md   # condensado del documento de arquitectura completo
├── TASKS.md           # checklist de la Fase 1 (MVP), por stage
├── apps/
│   ├── backend/       # NestJS — domain/application/infrastructure/presentation por módulo
│   │   └── prisma/    # schema.prisma (31 modelos) + seed + README de decisiones de modelado
│   ├── frontend/      # Angular
│   └── desktop/       # Electron (shell de escritorio + empaquetado)
└── packages/
    └── shared-types/  # DTOs e interfaces compartidas entre frontend y backend
```

El detalle completo de carpetas por módulo (domain/application/infrastructure/presentation) está en `docs/ARQUITECTURA.md`, sección "Estructura del proyecto". `apps/backend/src/catalogo/` ya está armado como ejemplo completo de ese patrón (entidad de dominio, puerto, caso de uso, test) — el resto de los módulos son carpetas placeholder con su propio `README.md`.

## Convenciones de trabajo

- **Branching:** trunk-based simplificado — `main` siempre desplegable, ramas cortas `feature/nombre-de-la-tarea` (idealmente el nombre de la tarea de `TASKS.md`), Pull Request contra `main` aunque sea auto-revisado.
- **Commits:** mensajes en español o inglés (elegí uno y sé consistente), en modo imperativo — "agrega caso de uso RegistrarMovimiento", no "agregado" ni "agregando".
- **Una tarea de `TASKS.md` = una rama = un PR chico.** Si una tarea se siente demasiado grande para un PR de una sentada, es señal de que hay que partirla en dos en `TASKS.md` antes de arrancarla, no de hacer un PR gigante.
- **Reglas de dependencia del backend:** `domain` nunca importa de `infrastructure` ni de Nest; `application` orquesta `domain` a través de puertos; `infrastructure` implementa esos puertos; `presentation` es la única capa que sabe que existe HTTP. Un PR que rompa esa dirección de dependencias no se mergea, aunque los tests pasen.
