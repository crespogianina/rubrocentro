// Funciones puras (sin Nest, sin caso de uso todavía — PR base de Stage 2).
// argon2 es una librería de cripto genérica, no infraestructura ni Nest, así
// que vive en domain/ sin romper la regla de dependencias de CLAUDE.md.

import * as argon2 from 'argon2';

export async function hashearContrasena(contrasena: string): Promise<string> {
  return argon2.hash(contrasena);
}

export async function verificarContrasena(contrasena: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, contrasena);
}
