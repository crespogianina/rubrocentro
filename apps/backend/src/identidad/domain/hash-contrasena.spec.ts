import { describe, expect, it } from 'vitest';
import { hashearContrasena, verificarContrasena } from './hash-contrasena.js';

describe('hashearContrasena / verificarContrasena', () => {
  it('genera un hash distinto del texto plano', async () => {
    const hash = await hashearContrasena('miContrasena123');

    expect(hash).not.toBe('miContrasena123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('verifica correctamente una contraseña correcta', async () => {
    const hash = await hashearContrasena('miContrasena123');

    await expect(verificarContrasena('miContrasena123', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashearContrasena('miContrasena123');

    await expect(verificarContrasena('otraContrasena', hash)).resolves.toBe(false);
  });

  it('genera hashes distintos para la misma contraseña (salt aleatorio)', async () => {
    const hash1 = await hashearContrasena('miContrasena123');
    const hash2 = await hashearContrasena('miContrasena123');

    expect(hash1).not.toBe(hash2);
  });
});
