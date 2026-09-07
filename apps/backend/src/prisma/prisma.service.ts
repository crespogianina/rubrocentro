import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Único punto de acceso a Prisma en todo el backend — los repositorios de
// infraestructura de cada módulo (Stage 3 de TASKS.md) inyectan este
// servicio, nunca instancian su propio PrismaClient.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
