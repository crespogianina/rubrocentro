// Seed de datos de ejemplo — Stage 1 de TASKS.md.
//
// TODO: completar con datos realistas de un local de informática:
//   - Roles: admin, encargado, vendedor, tecnico (+ permisos base en rol_permiso)
//   - Un usuario Admin de arranque
//   - Categorías: Componentes, Periféricos, Notebooks, Insumos (con jerarquía de ejemplo)
//   - Marcas: un puñado (ej. Logitech, Kingston, ASUS)
//   - Un depósito único
//   - Tipos de cotización: oficial, blue, mep, ccl, mayorista
//   - Métodos de pago: efectivo, débito, crédito, transferencia
//   - configuracion_negocio (fila "default")
//   - Unos 10-15 productos/variantes de ejemplo con stock inicial
//
// Correr con: pnpm --filter backend prisma db seed

import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Mismo driver adapter que PrismaService (ver src/prisma/prisma.service.ts) —
// Prisma 7 ya no arma la conexión desde schema.prisma en runtime.
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }),
});

async function main() {
  await prisma.configuracionNegocio.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', nombre: 'Mi local de informática' },
  });

  console.log('Seed base cargado. Faltan roles/productos de ejemplo — ver TODO en este archivo.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
