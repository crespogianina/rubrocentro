import { Inject, Injectable } from '@nestjs/common';
import { verificarContrasena } from '../../domain/hash-contrasena.js';
import { generarTokenJwt } from '../../domain/token-jwt.js';
import { CredencialesInvalidasError } from '../../domain/usuario.entity.js';
import { USUARIO_REPOSITORY } from '../ports/usuario-repository.port.js';
import type { UsuarioRepository } from '../ports/usuario-repository.port.js';

export interface AutenticarUsuarioInput {
  usuario: string;
  contrasena: string;
  jwtSecreto: string;
  jwtExpiracion: string; // mismo formato que JWT_EXPIRES_IN en .env
}

export interface AutenticarUsuarioResultado {
  token: string;
  usuarioId: string;
  rol: string;
}

@Injectable()
export class AutenticarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(input: AutenticarUsuarioInput): Promise<AutenticarUsuarioResultado> {
    const usuario = await this.usuarioRepository.buscarPorUsuario(input.usuario);

    // Mismo mensaje para usuario inexistente, inactivo o contraseña
    // incorrecta a propósito: no darle a quien intenta autenticarse una
    // pista de cuál de los tres fue el motivo del rechazo.
    if (!usuario || !usuario.activo) {
      throw new CredencialesInvalidasError('Usuario o contraseña incorrectos.');
    }

    const contrasenaValida = await verificarContrasena(input.contrasena, usuario.passwordHash);
    if (!contrasenaValida) {
      throw new CredencialesInvalidasError('Usuario o contraseña incorrectos.');
    }

    const token = generarTokenJwt({
      payload: { sub: usuario.id, rol: usuario.rolNombre },
      secreto: input.jwtSecreto,
      expiracion: input.jwtExpiracion,
    });

    return { token, usuarioId: usuario.id, rol: usuario.rolNombre };
  }
}
