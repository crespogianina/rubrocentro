import { describe, expect, it, vi } from 'vitest';
import { AutenticarUsuarioUseCase } from './autenticar-usuario.use-case.js';
import { hashearContrasena } from '../../domain/hash-contrasena.js';
import { validarTokenJwt } from '../../domain/token-jwt.js';
import { Usuario } from '../../domain/usuario.entity.js';
import { UsuarioRepository } from '../ports/usuario-repository.port.js';

const SECRETO = 'secreto-de-test';

async function crearUsuarioRepositorioFalso(
  contrasenaReal: string,
  overrides: Partial<{ activo: boolean; rolNombre: string }> = {},
): Promise<UsuarioRepository> {
  const passwordHash = await hashearContrasena(contrasenaReal);
  const usuario = Usuario.reconstruir({
    id: 'user-1',
    nombre: 'Admin',
    usuario: 'admin',
    passwordHash,
    rolNombre: overrides.rolNombre ?? 'admin',
    activo: overrides.activo ?? true,
  });

  return {
    buscarPorUsuario: vi.fn().mockResolvedValue(usuario),
  };
}

describe('AutenticarUsuarioUseCase', () => {
  it('autentica con usuario y contraseña correctos y devuelve un JWT válido', async () => {
    const usuarioRepositorio = await crearUsuarioRepositorioFalso('miContrasena123');
    const useCase = new AutenticarUsuarioUseCase(usuarioRepositorio);

    const resultado = await useCase.ejecutar({
      usuario: 'admin',
      contrasena: 'miContrasena123',
      jwtSecreto: SECRETO,
      jwtExpiracion: '1h',
    });

    expect(resultado.usuarioId).toBe('user-1');
    expect(resultado.rol).toBe('admin');
    const payload = validarTokenJwt<{ sub: string; rol: string }>(resultado.token, SECRETO);
    expect(payload.sub).toBe('user-1');
    expect(payload.rol).toBe('admin');
  });

  it('rechaza una contraseña incorrecta', async () => {
    const usuarioRepositorio = await crearUsuarioRepositorioFalso('miContrasena123');
    const useCase = new AutenticarUsuarioUseCase(usuarioRepositorio);

    await expect(
      useCase.ejecutar({
        usuario: 'admin',
        contrasena: 'otraContrasena',
        jwtSecreto: SECRETO,
        jwtExpiracion: '1h',
      }),
    ).rejects.toThrow();
  });

  it('rechaza un usuario que no existe', async () => {
    const usuarioRepositorio: UsuarioRepository = { buscarPorUsuario: vi.fn().mockResolvedValue(null) };
    const useCase = new AutenticarUsuarioUseCase(usuarioRepositorio);

    await expect(
      useCase.ejecutar({
        usuario: 'no-existe',
        contrasena: 'lo-que-sea',
        jwtSecreto: SECRETO,
        jwtExpiracion: '1h',
      }),
    ).rejects.toThrow();
  });

  it('rechaza un usuario inactivo (soft-deleted) aunque la contraseña sea correcta', async () => {
    const usuarioRepositorio = await crearUsuarioRepositorioFalso('miContrasena123', { activo: false });
    const useCase = new AutenticarUsuarioUseCase(usuarioRepositorio);

    await expect(
      useCase.ejecutar({
        usuario: 'admin',
        contrasena: 'miContrasena123',
        jwtSecreto: SECRETO,
        jwtExpiracion: '1h',
      }),
    ).rejects.toThrow();
  });
});
