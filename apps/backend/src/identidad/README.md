# Módulo `identidad`

Estado: **Stage 2 y 3 cerrados**. **Stage 4 en curso**: controller de login
y `JwtAuthGuard` (este último vive en `common/guards/`, ver README de ese
módulo — se aplica por ruta, todavía no hay ningún endpoint que lo use).

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
- `infrastructure/` — `PrismaUsuarioRepository`: `buscarPorUsuario` no
  filtra por `deletedAt` en la query (a propósito — `AutenticarUsuario`
  necesita distinguir "no existe" de "existe pero inactivo" para devolver
  el mismo mensaje genérico en los dos casos), resuelve `rolNombre` vía
  `include: { rol: true }`. Integration tests contra el SQLite de prueba
  compartido (`apps/backend/test/prisma-test-db.ts`, el mismo helper de
  `catalogo`/`stock`).
- `presentation/` — `IdentidadController` (`POST /api/v1/auth/login`, sin
  lógica propia — solo mapea `LoginDto` al input del caso de uso; el
  secreto/expiración de JWT los lee de env vía `ConfigService`, no del
  caso de uso). `identidad.module.ts` (en la raíz del módulo, no en
  `presentation/`, porque conecta las cuatro capas) cablea
  `PrismaUsuarioRepository` al puerto y se registra en `AppModule`.

Misma estructura que `catalogo/` (domain → application → infrastructure →
presentation) — ver ese módulo como plantilla del patrón antes de empezar
este.
