import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AutenticarUsuarioUseCase } from '../application/use-cases/autenticar-usuario.use-case.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';

// Sin lógica propia (ver docs/ARQUITECTURA.md, "Flujo de una request":
// "Controller (sin lógica)") — solo mapea el DTO al input del caso de uso.
// Las credenciales de JWT (secreto/expiración) viven en env, no en el
// caso de uso, porque son un detalle de infraestructura, no de dominio.
@ApiTags('identidad')
@Controller('auth')
export class IdentidadController {
  constructor(
    private readonly autenticarUsuario: AutenticarUsuarioUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.autenticarUsuario.ejecutar({
      usuario: dto.usuario,
      contrasena: dto.contrasena,
      jwtSecreto: this.configService.getOrThrow<string>('JWT_SECRET'),
      jwtExpiracion: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    });
  }
}
