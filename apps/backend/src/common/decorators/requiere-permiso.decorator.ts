import { SetMetadata } from '@nestjs/common';

// Ver CLAUDE.md, "Roles y permisos": autorización siempre del lado del
// backend, Guards contra el catálogo `rol_permiso` — nunca confiar en que
// el frontend oculte un botón. Un endpoint sin este decorator solo exige
// estar autenticado (vía JwtAuthGuard); con este decorator, además exige
// que el rol del usuario tenga ese permiso puntual cargado en `rol_permiso`.
export const PERMISO_REQUERIDO_KEY = 'permisoRequerido';

export const RequierePermiso = (permiso: string) => SetMetadata(PERMISO_REQUERIDO_KEY, permiso);
