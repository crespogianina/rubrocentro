# `common/`

Piezas transversales del backend que no pertenecen a un módulo de negocio
puntual — Guards de autenticación/permisos, interceptores de logging,
filtros de excepciones de dominio → respuesta HTTP consistente, y pipes de
validación compartidos. Ver Stage 4 de TASKS.md y docs/ARQUITECTURA.md,
sección "Backend" (flujo de una request).

- `guards/jwt-auth.guard.ts` — segundo eslabón del flujo de una request:
  valida el JWT del header `Authorization: Bearer <token>` (usando
  `validarTokenJwt` de `identidad/domain`) y cuelga el payload decodificado
  en `request.usuarioAutenticado` (`guards/usuario-autenticado.ts`) para que
  el Guard de permisos (próximo ítem de Stage 4) y los controllers lo lean
  sin volver a decodificar. Se aplica por ruta con `@UseGuards(JwtAuthGuard)`
  — todavía no hay ningún controller protegido que lo use (Stage 4:
  catalogo/stock).
- `decorators/requiere-permiso.decorator.ts` + `guards/permisos.guard.ts` —
  tercer eslabón: `@RequierePermiso('stock:ajustar')` en un handler hace que
  `PermisosGuard` valide `request.usuarioAutenticado.rol` (lo cuelga
  `JwtAuthGuard`, por eso siempre va después en `@UseGuards(...)`) contra el
  catálogo `rol_permiso` (consulta Prisma directo — es autorización, no
  regla de negocio, no justifica puerto/caso de uso propio). Una ruta sin
  el decorator solo exige estar autenticado. Los códigos de permiso
  (`ventas:crear`, `stock:ajustar`, etc.) están precargados en
  `prisma/seed.ts`.
- `filters/domain-exception.filter.ts` — último eslabón del flujo de una
  request: traduce las excepciones de dominio de cada módulo (clases
  planas que extienden `Error`, sin conocer HTTP) a una respuesta HTTP
  consistente (`{ statusCode, message, path, timestamp }`). Es la única
  pieza del backend que conoce a la vez el vocabulario de errores de cada
  módulo y el de Nest — agregar ahí cada tipo de error de dominio nuevo que
  se sume. Un error no mapeado cae a 500 sin exponer el mensaje interno
  (se loguea server-side). Registrado global en `main.ts`
  (`app.useGlobalFilters`).
