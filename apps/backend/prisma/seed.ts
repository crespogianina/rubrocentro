// Seed de datos de ejemplo — Stage 1 de TASKS.md.
//
// Pensado para un local de informática (rubro piloto, ver docs/ARQUITECTURA.md).
// Todo upsert es idempotente por una clave de negocio (nombre/codigo/sku) o,
// cuando el modelo no tiene una, por un id fijo elegido a mano — así correr
// el seed varias veces (p. ej. después de `prisma migrate reset`) no duplica filas.
//
// Correr con: pnpm --filter backend exec prisma db seed

import 'dotenv/config';
import { hash } from 'argon2';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Mismo driver adapter que PrismaService (ver src/prisma/prisma.service.ts) —
// Prisma 7 ya no arma la conexión desde schema.prisma en runtime.
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }),
});

// ── Roles y permisos ────────────────────────────────────────────────────
// Catálogo, no enum (ver docs/ARQUITECTURA.md, "Roles y permisos"). El MVP
// viene con estos 4 roles precargados y sin pantalla para crear roles nuevos.

const PERMISOS = [
  { codigo: 'ventas:crear', descripcion: 'Registrar una venta' },
  { codigo: 'ventas:anular', descripcion: 'Anular una venta confirmada' },
  { codigo: 'stock:ajustar', descripcion: 'Ajustar stock manualmente (con motivo obligatorio)' },
  { codigo: 'precios:modificar', descripcion: 'Modificar el precio de una variante' },
  { codigo: 'productos:eliminar', descripcion: 'Eliminar (soft-delete) un producto' },
  { codigo: 'compras:crear', descripcion: 'Registrar una compra a proveedor' },
  { codigo: 'clientes:crear', descripcion: 'Dar de alta un cliente' },
  { codigo: 'usuarios:administrar', descripcion: 'Crear, modificar o eliminar usuarios y roles' },
  { codigo: 'backups:restaurar', descripcion: 'Restaurar un backup de la base de datos' },
  { codigo: 'reportes:ver_costos', descripcion: 'Ver costos y márgenes en catálogo y reportes' },
  { codigo: 'ordenes_servicio:gestionar', descripcion: 'Crear y actualizar órdenes de servicio técnico' },
] as const;

// Ver docs/ARQUITECTURA.md, sección 25 ("Usuarios, roles y permisos").
const PERMISOS_POR_ROL: Record<string, string[]> = {
  admin: PERMISOS.map((p) => p.codigo),
  encargado: [
    'ventas:crear',
    'ventas:anular',
    'stock:ajustar',
    'precios:modificar',
    'productos:eliminar',
    'compras:crear',
    'clientes:crear',
    'reportes:ver_costos',
  ],
  vendedor: ['ventas:crear', 'clientes:crear'],
  tecnico: ['ordenes_servicio:gestionar'],
};

async function seedRolesYPermisos(): Promise<Record<string, string>> {
  for (const permiso of PERMISOS) {
    await prisma.permiso.upsert({
      where: { codigo: permiso.codigo },
      update: { descripcion: permiso.descripcion },
      create: permiso,
    });
  }

  const idPorNombre: Record<string, string> = {};
  for (const nombre of Object.keys(PERMISOS_POR_ROL)) {
    const rol = await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    idPorNombre[nombre] = rol.id;

    for (const permisoCodigo of PERMISOS_POR_ROL[nombre]) {
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoCodigo: { rolId: rol.id, permisoCodigo } },
        update: {},
        create: { rolId: rol.id, permisoCodigo },
      });
    }
  }
  return idPorNombre;
}

async function seedUsuarioAdmin(rolIdPorNombre: Record<string, string>): Promise<void> {
  await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador',
      usuario: 'admin',
      // Contraseña de arranque solo para desarrollo — cambiarla es lo primero
      // que hay que hacer en una instalación real (Fase 1: no hay pantalla
      // de "forzar cambio en primer login" todavía).
      passwordHash: await hash('admin123'),
      rolId: rolIdPorNombre.admin,
    },
  });
}

// ── Catálogo: categorías, marcas ────────────────────────────────────────
// Jerarquía de ejemplo: Componentes tiene subcategorías; el resto son planas.

async function seedCategorias(tipoCotizacionIdPorNombre: Record<string, string>): Promise<Record<string, string>> {
  const oficialId = tipoCotizacionIdPorNombre.oficial;

  const raices = [
    { id: 'cat-componentes', nombre: 'Componentes', tipoCotizacionDefaultId: oficialId },
    { id: 'cat-perifericos', nombre: 'Periféricos', tipoCotizacionDefaultId: null },
    { id: 'cat-notebooks', nombre: 'Notebooks', tipoCotizacionDefaultId: oficialId },
    { id: 'cat-insumos', nombre: 'Insumos', tipoCotizacionDefaultId: null },
  ];
  for (const categoria of raices) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: {},
      create: categoria,
    });
  }

  const subcategorias = [
    { id: 'cat-almacenamiento', nombre: 'Almacenamiento', categoriaPadreId: 'cat-componentes' },
    { id: 'cat-memorias', nombre: 'Memorias RAM', categoriaPadreId: 'cat-componentes' },
  ];
  for (const categoria of subcategorias) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: {},
      create: categoria,
    });
  }

  return {
    componentes: 'cat-componentes',
    perifericos: 'cat-perifericos',
    notebooks: 'cat-notebooks',
    insumos: 'cat-insumos',
    almacenamiento: 'cat-almacenamiento',
    memorias: 'cat-memorias',
  };
}

async function seedMarcas(): Promise<Record<string, string>> {
  const marcas = [
    { id: 'marca-logitech', nombre: 'Logitech' },
    { id: 'marca-kingston', nombre: 'Kingston' },
    { id: 'marca-asus', nombre: 'ASUS' },
    { id: 'marca-hp', nombre: 'HP' },
    { id: 'marca-genius', nombre: 'Genius' },
  ];
  for (const marca of marcas) {
    await prisma.marca.upsert({ where: { id: marca.id }, update: {}, create: marca });
  }
  return Object.fromEntries(marcas.map((m) => [m.nombre.toLowerCase(), m.id]));
}

// ── Stock: depósito único (ver docs/ARQUITECTURA.md, "un local por instalación") ──

async function seedDeposito(): Promise<string> {
  const deposito = await prisma.deposito.upsert({
    where: { id: 'deposito-principal' },
    update: {},
    create: { id: 'deposito-principal', nombre: 'Depósito principal' },
  });
  return deposito.id;
}

// ── Cotizaciones y métodos de pago ──────────────────────────────────────

async function seedTiposCotizacion(): Promise<Record<string, string>> {
  const tipos = [
    { nombre: 'oficial', fuente: 'dolarapi.com' },
    { nombre: 'blue', fuente: 'dolarapi.com' },
    { nombre: 'mep', fuente: 'dolarapi.com' },
    { nombre: 'ccl', fuente: 'dolarapi.com' },
    { nombre: 'mayorista', fuente: 'dolarapi.com' },
  ];
  const idPorNombre: Record<string, string> = {};
  for (const tipo of tipos) {
    const creado = await prisma.tipoCotizacion.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    });
    idPorNombre[tipo.nombre] = creado.id;
  }
  return idPorNombre;
}

async function seedMetodosPago(): Promise<void> {
  const metodos = [
    { id: 'metodo-efectivo', nombre: 'efectivo' },
    { id: 'metodo-debito', nombre: 'debito' },
    { id: 'metodo-credito', nombre: 'credito' },
    { id: 'metodo-transferencia', nombre: 'transferencia' },
  ];
  for (const metodo of metodos) {
    await prisma.metodoPago.upsert({ where: { id: metodo.id }, update: {}, create: metodo });
  }
}

// ── Productos y variantes de ejemplo, con stock inicial ─────────────────

type ProductoSeed = {
  id: string;
  nombre: string;
  categoriaId: string;
  marcaId: string | null;
  monedaCosto: 'ARS' | 'USD';
  costo: number;
  variantes: {
    sku: string;
    codigoBarras?: string;
    atributos: Record<string, string>;
    cantidad: number;
    puntoReposicion: number;
  }[];
};

async function seedProductos(
  categoriaId: Record<string, string>,
  marcaId: Record<string, string>,
  depositoId: string,
): Promise<void> {
  const productos: ProductoSeed[] = [
    {
      id: 'prod-notebook-asus-vivobook15',
      nombre: 'Notebook ASUS Vivobook 15',
      categoriaId: categoriaId.notebooks,
      marcaId: marcaId.asus,
      monedaCosto: 'USD',
      costo: 380,
      variantes: [
        {
          sku: 'NB-ASUS-VB15-8-512',
          atributos: { ram_gb: '8', almacenamiento_gb: '512' },
          cantidad: 4,
          puntoReposicion: 2,
        },
      ],
    },
    {
      id: 'prod-notebook-hp-240g9',
      nombre: 'Notebook HP 240 G9',
      categoriaId: categoriaId.notebooks,
      marcaId: marcaId.hp,
      monedaCosto: 'USD',
      costo: 340,
      variantes: [
        {
          sku: 'NB-HP-240G9-8-256',
          atributos: { ram_gb: '8', almacenamiento_gb: '256' },
          cantidad: 3,
          puntoReposicion: 2,
        },
      ],
    },
    {
      id: 'prod-mouse-logitech-m170',
      nombre: 'Mouse Logitech M170',
      categoriaId: categoriaId.perifericos,
      marcaId: marcaId.logitech,
      monedaCosto: 'ARS',
      costo: 8000,
      variantes: [
        { sku: 'MOU-LOG-M170', atributos: { color: 'negro' }, cantidad: 25, puntoReposicion: 5 },
      ],
    },
    {
      id: 'prod-teclado-logitech-k120',
      nombre: 'Teclado Logitech K120',
      categoriaId: categoriaId.perifericos,
      marcaId: marcaId.logitech,
      monedaCosto: 'ARS',
      costo: 12000,
      variantes: [
        { sku: 'TEC-LOG-K120', atributos: { idioma: 'es-latam' }, cantidad: 18, puntoReposicion: 4 },
      ],
    },
    {
      id: 'prod-ram-kingston-fury-3200',
      nombre: 'Memoria RAM Kingston Fury 3200MHz',
      categoriaId: categoriaId.memorias,
      marcaId: marcaId.kingston,
      monedaCosto: 'USD',
      costo: 18,
      variantes: [
        { sku: 'RAM-KING-FURY-8', atributos: { capacidad_gb: '8' }, cantidad: 15, puntoReposicion: 5 },
        { sku: 'RAM-KING-FURY-16', atributos: { capacidad_gb: '16' }, cantidad: 12, puntoReposicion: 5 },
      ],
    },
    {
      id: 'prod-ssd-kingston-nv2',
      nombre: 'SSD Kingston NV2 NVMe',
      categoriaId: categoriaId.almacenamiento,
      marcaId: marcaId.kingston,
      monedaCosto: 'USD',
      costo: 22,
      variantes: [
        { sku: 'SSD-KING-NV2-480', atributos: { capacidad_gb: '480' }, cantidad: 20, puntoReposicion: 6 },
        { sku: 'SSD-KING-NV2-1TB', atributos: { capacidad_gb: '1000' }, cantidad: 10, puntoReposicion: 4 },
      ],
    },
    {
      id: 'prod-pendrive-kingston-dt',
      nombre: 'Pendrive Kingston DataTraveler',
      categoriaId: categoriaId.insumos,
      marcaId: marcaId.kingston,
      monedaCosto: 'ARS',
      costo: 3500,
      variantes: [
        { sku: 'USB-KING-DT-32', atributos: { capacidad_gb: '32' }, cantidad: 30, puntoReposicion: 8 },
        { sku: 'USB-KING-DT-64', atributos: { capacidad_gb: '64' }, cantidad: 20, puntoReposicion: 6 },
      ],
    },
    {
      id: 'prod-auriculares-genius-hsm200c',
      nombre: 'Auriculares Genius HS-M200C',
      categoriaId: categoriaId.perifericos,
      marcaId: marcaId.genius,
      monedaCosto: 'ARS',
      costo: 4500,
      variantes: [
        { sku: 'AUR-GEN-HSM200C', atributos: { color: 'negro' }, cantidad: 22, puntoReposicion: 5 },
      ],
    },
    {
      id: 'prod-cable-hdmi-18m',
      nombre: 'Cable HDMI 1.8m',
      categoriaId: categoriaId.insumos,
      marcaId: null,
      monedaCosto: 'ARS',
      costo: 2500,
      variantes: [
        { sku: 'CAB-HDMI-18M', atributos: { longitud_m: '1.8' }, cantidad: 40, puntoReposicion: 10 },
      ],
    },
    {
      id: 'prod-mousepad-genius',
      nombre: 'Mousepad Genius',
      categoriaId: categoriaId.insumos,
      marcaId: marcaId.genius,
      monedaCosto: 'ARS',
      costo: 1800,
      variantes: [{ sku: 'MP-GEN-STD', atributos: { tamano: 'standard' }, cantidad: 35, puntoReposicion: 8 }],
    },
  ];

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { id: producto.id },
      update: {},
      create: {
        id: producto.id,
        nombre: producto.nombre,
        categoriaId: producto.categoriaId,
        marcaId: producto.marcaId,
        unidadMedidaBase: 'unidad',
        monedaCosto: producto.monedaCosto,
        costo: producto.costo,
      },
    });

    for (const variante of producto.variantes) {
      const varianteCreada = await prisma.variante.upsert({
        where: { sku: variante.sku },
        update: {},
        create: {
          productoId: producto.id,
          sku: variante.sku,
          codigoBarras: variante.codigoBarras,
          atributos: variante.atributos,
        },
      });

      await prisma.stock.upsert({
        where: { varianteId_depositoId: { varianteId: varianteCreada.id, depositoId } },
        update: {},
        create: {
          varianteId: varianteCreada.id,
          depositoId,
          cantidad: variante.cantidad,
          puntoReposicion: variante.puntoReposicion,
        },
      });
    }
  }
}

async function main() {
  await prisma.configuracionNegocio.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', nombre: 'Mi local de informática' },
  });

  const rolIdPorNombre = await seedRolesYPermisos();
  await seedUsuarioAdmin(rolIdPorNombre);

  const tipoCotizacionIdPorNombre = await seedTiposCotizacion();
  await seedMetodosPago();

  const categoriaId = await seedCategorias(tipoCotizacionIdPorNombre);
  const marcaId = await seedMarcas();
  const depositoId = await seedDeposito();

  await seedProductos(categoriaId, marcaId, depositoId);

  console.log('Seed completo: roles/permisos, usuario admin, categorías, marcas, depósito,');
  console.log('tipos de cotización, métodos de pago y productos/variantes de ejemplo con stock.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
