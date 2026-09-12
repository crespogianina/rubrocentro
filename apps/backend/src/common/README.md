# `common/`

Piezas transversales del backend que no pertenecen a un módulo de negocio
puntual — Guards de autenticación/permisos, interceptores de logging,
filtros de excepciones de dominio → respuesta HTTP consistente, y pipes de
validación compartidos. Ver Stage 4 de TASKS.md y docs/ARQUITECTURA.md,
sección "Backend" (flujo de una request).

- `filters/domain-exception.filter.ts` — último eslabón del flujo de una
  request: traduce las excepciones de dominio de cada módulo (clases
  planas que extienden `Error`, sin conocer HTTP) a una respuesta HTTP
  consistente (`{ statusCode, message, path, timestamp }`). Es la única
  pieza del backend que conoce a la vez el vocabulario de errores de cada
  módulo y el de Nest — agregar ahí cada tipo de error de dominio nuevo que
  se sume. Un error no mapeado cae a 500 sin exponer el mensaje interno
  (se loguea server-side). Registrado global en `main.ts`
  (`app.useGlobalFilters`).
