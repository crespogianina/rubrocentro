import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PERMISO_REQUERIDO_KEY } from '../decorators/requiere-permiso.decorator.js';
import type { RequestConUsuario } from './usuario-autenticado.js';

// Tercer eslabón del flujo de una request (docs/ARQUITECTURA.md, "Flujo de
// una request"), siempre después de JwtAuthGuard en `@UseGuards(...)` — lee
// `request.usuarioAutenticado.rol` (lo cuelga JwtAuthGuard) y lo valida
// contra el catálogo `rol_permiso` (CLAUDE.md, "Roles y permisos": nunca
// confiar en que el frontend oculte un botón). Consulta Prisma directo —
// es una verificación de autorización, no una regla de negocio, no
// justifica un puerto/caso de uso propio (ver CLAUDE.md, "No overengineering").
//
// Una ruta sin @RequierePermiso solo exige estar autenticado.
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permisoRequerido = this.reflector.get<string | undefined>(
      PERMISO_REQUERIDO_KEY,
      context.getHandler(),
    );
    if (!permisoRequerido) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const rolNombre = request.usuarioAutenticado?.rol;
    if (!rolNombre) {
      // No debería pasar si JwtAuthGuard corrió antes — sin usuario
      // autenticado no hay rol que chequear.
      throw new ForbiddenException('No autorizado.');
    }

    const tienePermiso = await this.prisma.rolPermiso.findFirst({
      where: { permisoCodigo: permisoRequerido, rol: { nombre: rolNombre } },
    });

    if (!tienePermiso) {
      throw new ForbiddenException(
        `El rol "${rolNombre}" no tiene el permiso "${permisoRequerido}".`,
      );
    }

    return true;
  }
}
