import { describe, expect, it } from 'vitest';
import { generarTokenJwt, TokenInvalidoError, validarTokenJwt } from './token-jwt.js';

describe('generarTokenJwt / validarTokenJwt', () => {
  const secreto = 'secreto-de-test';

  it('genera un token que se puede validar y devuelve el payload original', () => {
    const token = generarTokenJwt({
      payload: { sub: 'user-1', rol: 'admin' },
      secreto,
      expiracion: '1h',
    });

    const payload = validarTokenJwt<{ sub: string; rol: string }>(token, secreto);

    expect(payload.sub).toBe('user-1');
    expect(payload.rol).toBe('admin');
  });

  it('rechaza un token firmado con otro secreto', () => {
    const token = generarTokenJwt({ payload: { sub: 'user-1' }, secreto: 'otro-secreto', expiracion: '1h' });

    expect(() => validarTokenJwt(token, secreto)).toThrow(TokenInvalidoError);
  });

  it('rechaza un token expirado', () => {
    const token = generarTokenJwt({ payload: { sub: 'user-1' }, secreto, expiracion: '-1s' });

    expect(() => validarTokenJwt(token, secreto)).toThrow(TokenInvalidoError);
  });

  it('rechaza un token malformado', () => {
    expect(() => validarTokenJwt('no-es-un-token', secreto)).toThrow(TokenInvalidoError);
  });
});
