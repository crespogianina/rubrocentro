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
