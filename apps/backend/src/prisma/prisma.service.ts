import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Único punto de acceso a Prisma en todo el backend — los repositorios de
// infraestructura de cada módulo (Stage 3 de TASKS.md) inyectan este
// servicio, nunca instancian su propio PrismaClient.
//
// Prisma 7 dejó de leer la URL de conexión desde schema.prisma en runtime:
// el cliente necesita un driver adapter explícito (ver prisma.config.ts
// para el mismo dato del lado de Migrate/Studio).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
