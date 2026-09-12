import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { RequestConUsuario } from './usuario-autenticado.js';
import { generarTokenJwt } from '../../identidad/domain/token-jwt.js';

const SECRETO = 'a'.repeat(32);

function crearConfigServiceFalso(secreto = SECRETO): ConfigService {
  return { getOrThrow: vi.fn().mockReturnValue(secreto) } as unknown as ConfigService;
}

function crearContexto(headers: Record<string, string> = {}): {
  context: ExecutionContext;
  request: RequestConUsuario;
} {
  const request = { headers } as unknown as RequestConUsuario;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  it('permite el acceso con un token válido y cuelga el payload en la request', () => {
    const token = generarTokenJwt({
      payload: { sub: 'user-1', rol: 'admin' },
      secreto: SECRETO,
      expiracion: '1h',
    });
    const { context, request } = crearContexto({ authorization: `Bearer ${token}` });
    const guard = new JwtAuthGuard(crearConfigServiceFalso());

    expect(guard.canActivate(context)).toBe(true);
    expect(request.usuarioAutenticado).toEqual(
      expect.objectContaining({ sub: 'user-1', rol: 'admin' }),
    );
  });

  it('rechaza si falta el header Authorization', () => {
    const { context } = crearContexto();
    const guard = new JwtAuthGuard(crearConfigServiceFalso());

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rechaza un header sin el prefijo "Bearer "', () => {
    const token = generarTokenJwt({ payload: { sub: 'user-1', rol: 'admin' }, secreto: SECRETO, expiracion: '1h' });
    const { context } = crearContexto({ authorization: token });
    const guard = new JwtAuthGuard(crearConfigServiceFalso());

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rechaza un token firmado con otro secreto', () => {
    const token = generarTokenJwt({
      payload: { sub: 'user-1', rol: 'admin' },
      secreto: 'otro-secreto-distinto-de-32-caracteres',
      expiracion: '1h',
    });
    const { context } = crearContexto({ authorization: `Bearer ${token}` });
    const guard = new JwtAuthGuard(crearConfigServiceFalso());

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rechaza un token expirado', () => {
    const token = generarTokenJwt({
      payload: { sub: 'user-1', rol: 'admin' },
      secreto: SECRETO,
      expiracion: '-1s',
    });
    const { context } = crearContexto({ authorization: `Bearer ${token}` });
    const guard = new JwtAuthGuard(crearConfigServiceFalso());

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
