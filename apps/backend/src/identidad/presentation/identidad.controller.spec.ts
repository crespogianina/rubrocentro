import { describe, expect, it, vi } from 'vitest';
import { IdentidadController } from './identidad.controller.js';
import type { AutenticarUsuarioUseCase } from '../application/use-cases/autenticar-usuario.use-case.js';
import type { ConfigService } from '@nestjs/config';

function crearConfigServiceFalso(): ConfigService {
  const valores: Record<string, string> = {
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '45m',
  };
  return { getOrThrow: vi.fn((clave: string) => valores[clave]) } as unknown as ConfigService;
}

describe('IdentidadController', () => {
  it('mapea el DTO al input del caso de uso, leyendo el secreto y la expiración de env', async () => {
    const resultado = { token: 'jwt-firmado', usuarioId: 'user-1', rol: 'admin' };
    const autenticarUsuario = {
      ejecutar: vi.fn().mockResolvedValue(resultado),
    } as unknown as AutenticarUsuarioUseCase;
    const controller = new IdentidadController(autenticarUsuario, crearConfigServiceFalso());

    const respuesta = await controller.login({ usuario: 'admin', contrasena: 'miContrasena123' });

    expect(respuesta).toEqual(resultado);
    expect(autenticarUsuario.ejecutar).toHaveBeenCalledWith({
      usuario: 'admin',
      contrasena: 'miContrasena123',
      jwtSecreto: 'a'.repeat(32),
      jwtExpiracion: '45m',
    });
  });

  it('propaga el rechazo del caso de uso (ej. CredencialesInvalidasError) sin capturarlo', async () => {
    const autenticarUsuario = {
      ejecutar: vi.fn().mockRejectedValue(new Error('Usuario o contraseña incorrectos.')),
    } as unknown as AutenticarUsuarioUseCase;
    const controller = new IdentidadController(autenticarUsuario, crearConfigServiceFalso());

    await expect(controller.login({ usuario: 'admin', contrasena: 'mal' })).rejects.toThrow(
      'Usuario o contraseña incorrectos.',
    );
  });
});
