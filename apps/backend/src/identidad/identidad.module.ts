import { Module } from '@nestjs/common';
import { PrismaUsuarioRepository } from './infrastructure/prisma-usuario.repository.js';
import { USUARIO_REPOSITORY } from './application/ports/usuario-repository.port.js';
import { AutenticarUsuarioUseCase } from './application/use-cases/autenticar-usuario.use-case.js';
import { IdentidadController } from './presentation/identidad.controller.js';

@Module({
  controllers: [IdentidadController],
  providers: [
    AutenticarUsuarioUseCase,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
  ],
})
export class IdentidadModule {}
