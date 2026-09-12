import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { PermisosGuard } from './permisos.guard.js';
import type { RequestConUsuario } from './usuario-autenticado.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

function crearReflectorFalso(permisoRequerido: string | undefined): Reflector {
  return { get: vi.fn().mockReturnValue(permisoRequerido) } as unknown as Reflector;
}

function crearPrismaFalso(tienePermiso: boolean): PrismaService {
  return {
    rolPermiso: { findFirst: vi.fn().mockResolvedValue(tienePermiso ? {} : null) },
  } as unknown as PrismaService;
}

function crearContexto(rol?: string): ExecutionContext {
  const request = { usuarioAutenticado: rol ? { sub: 'user-1', rol } : undefined } as RequestConUsuario;
  return {
    getHandler: () => vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PermisosGuard', () => {
  it('permite el acceso si la ruta no exige ningún permiso puntual', async () => {
    const guard = new PermisosGuard(crearReflectorFalso(undefined), crearPrismaFalso(false));

    await expect(guard.canActivate(crearContexto('vendedor'))).resolves.toBe(true);
  });

  it('permite el acceso si el rol del usuario tiene el permiso requerido', async () => {
    const prisma = crearPrismaFalso(true);
    const guard = new PermisosGuard(crearReflectorFalso('stock:ajustar'), prisma);

    await expect(guard.canActivate(crearContexto('encargado'))).resolves.toBe(true);
    expect(prisma.rolPermiso.findFirst).toHaveBeenCalledWith({
      where: { permisoCodigo: 'stock:ajustar', rol: { nombre: 'encargado' } },
    });
  });

  it('rechaza con 403 si el rol no tiene el permiso requerido', async () => {
    const guard = new PermisosGuard(crearReflectorFalso('usuarios:administrar'), crearPrismaFalso(false));

    await expect(guard.canActivate(crearContexto('vendedor'))).rejects.toThrow(ForbiddenException);
  });

  it('rechaza si no hay usuario autenticado en la request (JwtAuthGuard no corrió antes)', async () => {
    const guard = new PermisosGuard(crearReflectorFalso('ventas:crear'), crearPrismaFalso(true));

    await expect(guard.canActivate(crearContexto(undefined))).rejects.toThrow(ForbiddenException);
  });
});
