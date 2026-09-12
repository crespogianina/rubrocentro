import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaUsuarioRepository } from './prisma-usuario.repository.js';
import { crearPrismaDeTest } from '../../../test/prisma-test-db.js';
import type { PrismaTestDb } from '../../../test/prisma-test-db.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// Integration test contra un SQLite de prueba real (Stage 3, TASKS.md).
describe('PrismaUsuarioRepository', () => {
  let db: PrismaTestDb;
  let repositorio: PrismaUsuarioRepository;
  let rolId: string;

  beforeAll(async () => {
    db = crearPrismaDeTest();
    repositorio = new PrismaUsuarioRepository(db.prisma as unknown as PrismaService);

    const rol = await db.prisma.rol.create({ data: { nombre: 'vendedor' } });
    rolId = rol.id;
  }, 30_000);

  afterAll(async () => {
    await db.cerrar();
  });

  it('encuentra un usuario activo por nombre de login, con el nombre del rol resuelto', async () => {
    await db.prisma.usuario.create({
      data: { nombre: 'Vendedor Uno', usuario: 'vendedor1', passwordHash: 'hash-x', rolId },
    });

    const usuario = await repositorio.buscarPorUsuario('vendedor1');

    expect(usuario).not.toBeNull();
    expect(usuario?.passwordHash).toBe('hash-x');
    expect(usuario?.rolNombre).toBe('vendedor');
    expect(usuario?.activo).toBe(true);
  });

  it('devuelve un usuario con soft-delete (deletedAt seteado) como inactivo, no como null', async () => {
    await db.prisma.usuario.create({
      data: {
        nombre: 'Ex Empleado',
        usuario: 'ex-empleado',
        passwordHash: 'hash-y',
        rolId,
        deletedAt: new Date(),
      },
    });

    const usuario = await repositorio.buscarPorUsuario('ex-empleado');

    expect(usuario).not.toBeNull();
    expect(usuario?.activo).toBe(false);
  });

  it('devuelve null si no existe un usuario con ese nombre de login', async () => {
    const usuario = await repositorio.buscarPorUsuario('no-existe');
    expect(usuario).toBeNull();
  });
});
