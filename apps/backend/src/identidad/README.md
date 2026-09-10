# Módulo `identidad`

Estado: **Stage 2 de TASKS.md cerrado** — funciones puras de hash/JWT,
puerto `UsuarioRepository` y caso de uso `AutenticarUsuario` listos.

Usuarios, roles, permisos y autenticación (JWT + argon2). Ver docs/ARQUITECTURA.md, sección "Autenticación y sesiones".

- `domain/`:
  - `hash-contrasena.ts` — `hashearContrasena`/`verificarContrasena` con
    `argon2`.
  - `token-jwt.ts` — `generarTokenJwt`/`validarTokenJwt` con `jsonwebtoken`
    directo (no `@nestjs/jwt`, a propósito: `domain/` no puede importar
    nada de Nest — ver CLAUDE.md). `jsonwebtoken` ya era una dependencia
    transitiva de `@nestjs/jwt`; se agregó como dependencia directa del
    backend para poder importarla sin depender de un paquete fantasma.
  - `usuario.entity.ts` — `Usuario`, sin `crear()`/invariantes de
    construcción todavía: esta tarea solo necesita leer un usuario ya
    persistido para autenticarlo (`Usuario.reconstruir`). Si más adelante
    se agrega una pantalla de alta de usuarios, ahí es donde va un
    `CrearUsuario` con sus propias validaciones — no se adelantaron sin un
    caso de uso real que las necesite.
- `application/ports/` — `UsuarioRepository` (`buscarPorUsuario`).
- `application/use-cases/` — `AutenticarUsuario`: valida usuario/contraseña
  (mismo mensaje de error para usuario inexistente, inactivo o contraseña
  incorrecta, a propósito — no dar pistas de cuál falló) y emite un JWT con
  `{ sub: usuarioId, rol }`.
- `infrastructure/`, `presentation/` — **vacío todavía** (Stage 3/4:
  `PrismaUsuarioRepository`, controller de login, Guard de JWT).

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón antes de empezar
este.
