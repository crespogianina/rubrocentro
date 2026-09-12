import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Helper compartido para los tests de integración de Stage 3 (TASKS.md,
// "Testing": "integration (repositorios contra SQLite de prueba) en cada
// push"). Cada test de integración levanta su propio archivo SQLite
// descartable, sincronizado con el schema real vía `prisma db push` — así
// se prueba el adaptador contra una base de verdad en vez de mockear Prisma.
export interface PrismaTestDb {
  prisma: PrismaClient;
  cerrar(): Promise<void>;
}

export function crearPrismaDeTest(): PrismaTestDb {
  const archivo = join(process.cwd(), `test-${randomUUID()}.db`); // *.db está gitignoreado
  const url = `file:${archivo}`;

  // Prisma 7 sacó `--skip-generate` de `db push` (no hace falta de
  // cualquier forma: el cliente ya está generado por Stage 1).
  execSync('pnpm exec prisma db push --accept-data-loss', {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  return {
    prisma,
    async cerrar(): Promise<void> {
      await prisma.$disconnect();
      for (const sufijo of ['', '-journal', '-wal', '-shm']) {
        const ruta = `${archivo}${sufijo}`;
        if (existsSync(ruta)) rmSync(ruta);
      }
    },
  };
}
