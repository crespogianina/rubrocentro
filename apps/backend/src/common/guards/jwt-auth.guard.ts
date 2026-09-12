import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validarTokenJwt } from '../../identidad/domain/token-jwt.js';
import type { RequestConUsuario, UsuarioAutenticadoPayload } from './usuario-autenticado.js';

// Segundo eslabón del flujo de una request (docs/ARQUITECTURA.md, "Flujo de
// una request"): valida el JWT del header `Authorization: Bearer <token>` y
// cuelga el payload decodificado en la request (`usuarioAutenticado`) para
// que el Guard de permisos y los controllers lo lean sin volver a
// decodificar. Se aplica por ruta/controller con `@UseGuards(JwtAuthGuard)`
// — todavía no está registrado global (ver README de este módulo).
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestConUsuario>();
    const token = this.extraerToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación.');
    }

    try {
      const secreto = this.configService.getOrThrow<string>('JWT_SECRET');
      request.usuarioAutenticado = validarTokenJwt<UsuarioAutenticadoPayload>(token, secreto);
      return true;
    } catch {
      // Cubre tanto un token malformado/expirado (TokenInvalidoError, ver
      // identidad/domain/token-jwt.ts) como JWT_SECRET ausente — en los dos
      // casos la respuesta correcta es la misma: no autenticado.
      throw new UnauthorizedException('El token es inválido o expiró.');
    }
  }

  private extraerToken(request: RequestConUsuario): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    return header.slice('Bearer '.length).trim() || null;
  }
}
