import type { Request } from 'express';

// Payload que `AutenticarUsuarioUseCase` firma en el JWT (ver
// src/identidad/application/use-cases/autenticar-usuario.use-case.ts).
export interface UsuarioAutenticadoPayload {
  sub: string;
  rol: string;
}

// `JwtAuthGuard` cuelga el payload decodificado acá para que el Guard de
// permisos y los controllers lo lean sin volver a decodificar el token.
export interface RequestConUsuario extends Request {
  usuarioAutenticado?: UsuarioAutenticadoPayload;
}
