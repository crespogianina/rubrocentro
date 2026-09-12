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
- `filters/domain-exception.filter.ts` — último eslabón del flujo de una
  request: traduce las excepciones de dominio de cada módulo (clases
  planas que extienden `Error`, sin conocer HTTP) a una respuesta HTTP
  consistente (`{ statusCode, message, path, timestamp }`). Es la única
  pieza del backend que conoce a la vez el vocabulario de errores de cada
  módulo y el de Nest — agregar ahí cada tipo de error de dominio nuevo que
  se sume. Un error no mapeado cae a 500 sin exponer el mensaje interno
  (se loguea server-side). Registrado global en `main.ts`
  (`app.useGlobalFilters`).
- `interceptors/logging.interceptor.ts` — loguea método, URL, status code y
  duración de cada request (éxito) o método/URL/mensaje de error (falla,
  como warning) — el status real de un error lo decide
  `DomainExceptionFilter`, no se duplica esa lógica acá. Registrado global
  en `main.ts` (`app.useGlobalInterceptors`).
