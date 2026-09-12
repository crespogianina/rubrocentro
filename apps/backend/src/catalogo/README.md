# Módulo `catalogo`

Estado: **Stage 2, 3 y el ítem de Stage 4 de este módulo cerrados.**

- `domain/` — entidades puras (`Producto`, `Variante`), sin dependencias de Nest ni Prisma.
- `application/` — puertos (interfaces) y casos de uso, testeados contra los
  puertos, no contra una base de datos real.
- `infrastructure/` — `PrismaProductoRepository` y `PrismaVarianteRepository`,
  con integration tests contra un SQLite de prueba
  (`apps/backend/test/prisma-test-db.ts`).
- `presentation/` — `CatalogoController` (`POST /api/v1/productos`,
  `POST /api/v1/productos/:productoId/variantes`), sin lógica propia — solo
  mapea DTOs a los casos de uso. Protegido con `JwtAuthGuard` (exige estar
  autenticado) pero **sin** `@RequierePermiso`: el catálogo de permisos
  (`prisma/seed.ts`) no tiene un código para "crear producto/variante" — a
  diferencia de `productos:eliminar`, el alta de catálogo es una tarea
  operativa habitual, no restringida por rol. `catalogo.module.ts` (en la
  raíz del módulo, no en `presentation/`, porque conecta las cuatro capas)
  cablea los dos repositorios y se registra en `AppModule`.

Misma estructura que se repitió en `identidad`/`stock`/`cotizaciones` —
sigue siendo la plantilla de referencia del patrón domain → application →
infrastructure → presentation.
