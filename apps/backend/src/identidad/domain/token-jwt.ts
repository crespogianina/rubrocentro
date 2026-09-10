// Funciones puras (sin Nest, sin caso de uso todavía — PR base de Stage 2).
// Se usa `jsonwebtoken` directo en vez de `@nestjs/jwt` a propósito: este
// módulo vive en domain/, que no puede importar nada de Nest (ver
// CLAUDE.md). `jsonwebtoken` ya era una dependencia transitiva de
// `@nestjs/jwt` — se agregó como dependencia directa del backend para poder
// importarla acá sin depender de un paquete fantasma.

import jwt from 'jsonwebtoken';

export class TokenInvalidoError extends Error {}

export interface GenerarTokenJwtInput {
  payload: Record<string, unknown>;
  secreto: string;
  // Mismo formato que JWT_EXPIRES_IN en .env (ej. '45m', '7d').
  expiracion: string;
}

export function generarTokenJwt({ payload, secreto, expiracion }: GenerarTokenJwtInput): string {
  return jwt.sign(payload, secreto, { expiresIn: expiracion } as jwt.SignOptions);
}

export function validarTokenJwt<T extends object = Record<string, unknown>>(
  token: string,
  secreto: string,
): T {
  try {
    return jwt.verify(token, secreto) as T;
  } catch {
    throw new TokenInvalidoError('El token es inválido o expiró.');
  }
}
