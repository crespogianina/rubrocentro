import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: PrismaService gestiona su propia conexión ($connect/$disconnect
// en los lifecycle hooks) — una sola instancia para todo el proceso, nunca
// una por módulo. Cualquier módulo que necesite un repositorio Prisma
// inyecta PrismaService sin tener que reimportar este módulo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
