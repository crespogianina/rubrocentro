# Módulo `identidad`

Estado: **Stage 2 de TASKS.md en curso** — funciones puras de hash y JWT
listas; falta el puerto `UsuarioRepository` y el caso de uso
`AutenticarUsuario`.

Usuarios, roles, permisos y autenticación (JWT + argon2). Ver docs/ARQUITECTURA.md, sección "Autenticación y sesiones".

- `domain/`:
  - `hash-contrasena.ts` — `hashearContrasena`/`verificarContrasena` con
    `argon2`.
  - `token-jwt.ts` — `generarTokenJwt`/`validarTokenJwt` con `jsonwebtoken`
    directo (no `@nestjs/jwt`, a propósito: `domain/` no puede importar
    nada de Nest — ver CLAUDE.md). `jsonwebtoken` ya era una dependencia
    transitiva de `@nestjs/jwt`; se agregó como dependencia directa del
    backend para poder importarla sin depender de un paquete fantasma.
  - Ambos son funciones puras sin estado ni caso de uso todavía — los usa
    `AutenticarUsuario` (próxima tarea).
- `application/`, `infrastructure/`, `presentation/` — **vacío todavía**.

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón antes de empezar
este.
