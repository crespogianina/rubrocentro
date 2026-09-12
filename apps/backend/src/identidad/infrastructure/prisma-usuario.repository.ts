import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Usuario } from '../domain/usuario.entity.js';
import type { UsuarioRepository } from '../application/ports/usuario-repository.port.js';

// Adaptador de infraestructura — implementa el puerto `UsuarioRepository`
// (Stage 2) contra Prisma/SQLite. El dominio y los casos de uso no lo
// importan.
@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorUsuario(usuario: string): Promise<Usuario | null> {
    // Sin filtrar por deletedAt acá a propósito: AutenticarUsuario (Stage 2)
    // necesita distinguir "no existe" de "existe pero está inactivo" para
    // devolver el mismo mensaje genérico en los dos casos sin filtrar en la
    // query — ver docs/ARQUITECTURA.md, sección 40 "Autenticación y sesiones".
    const fila = await this.prisma.usuario.findUnique({
      where: { usuario },
      include: { rol: true },
    });

    if (!fila) return null;

    return Usuario.reconstruir({
      id: fila.id,
      nombre: fila.nombre,
      usuario: fila.usuario,
      passwordHash: fila.passwordHash,
      rolNombre: fila.rol.nombre,
      activo: fila.deletedAt === null,
    });
  }
}
