import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 movió la URL de conexión (usada por Migrate/Studio) fuera de
// schema.prisma. El cliente en runtime resuelve su propia conexión vía
// driver adapter en `PrismaService` — este archivo es solo para el CLI.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    // Prisma 7 dejó de leer `"prisma": { "seed": ... }` de package.json.
    seed: 'tsx prisma/seed.ts',
  },
});
