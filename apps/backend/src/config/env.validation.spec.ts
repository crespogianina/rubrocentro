import { describe, expect, it } from 'vitest';
import { validarEnv } from './env.validation.js';

function envValido(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    PORT: '3000',
    DATABASE_URL: 'file:./dev.db',
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '45m',
    DOLAR_API_URL: 'https://dolarapi.com/v1',
    ...overrides,
  };
}

describe('validarEnv', () => {
  it('devuelve la config sin tocarla cuando todo es válido', () => {
    const config = envValido();

    expect(validarEnv(config)).toBe(config);
  });

  it('rechaza JWT_SECRET ausente', () => {
    const config = envValido({ JWT_SECRET: undefined });

    expect(() => validarEnv(config)).toThrow(/JWT_SECRET/);
  });

  it('rechaza JWT_SECRET corto', () => {
    const config = envValido({ JWT_SECRET: 'muy-corto' });

    expect(() => validarEnv(config)).toThrow(/JWT_SECRET/);
  });

  it('rechaza JWT_SECRET igual al placeholder de .env.example', () => {
    const config = envValido({ JWT_SECRET: 'cambiar-esto-por-un-valor-generado-para-desarrollo' });

    expect(() => validarEnv(config)).toThrow(/valor de ejemplo/);
  });

  it('rechaza JWT_EXPIRES_IN con formato inválido', () => {
    const config = envValido({ JWT_EXPIRES_IN: '45 minutos' });

    expect(() => validarEnv(config)).toThrow(/JWT_EXPIRES_IN/);
  });

  it('rechaza DATABASE_URL faltante', () => {
    const config = envValido({ DATABASE_URL: '' });

    expect(() => validarEnv(config)).toThrow(/DATABASE_URL/);
  });

  it('rechaza DOLAR_API_URL faltante', () => {
    const config = envValido({ DOLAR_API_URL: undefined });

    expect(() => validarEnv(config)).toThrow(/DOLAR_API_URL/);
  });

  it('acumula todos los errores en un solo mensaje', () => {
    const config = envValido({ JWT_SECRET: '', DATABASE_URL: '' });

    try {
      validarEnv(config);
      expect.unreachable('debía lanzar');
    } catch (error) {
      expect((error as Error).message).toMatch(/JWT_SECRET/);
      expect((error as Error).message).toMatch(/DATABASE_URL/);
    }
  });
});
