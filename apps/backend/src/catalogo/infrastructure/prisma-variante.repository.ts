import { Injectable } from '@nestjs/common';
import type { Variante as VarianteFila } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Variante, type Atributos } from '../domain/variante.entity.js';
import type { VarianteRepository } from '../application/ports/variante-repository.port.js';

// Adaptador de infraestructura — implementa el puerto `VarianteRepository`
// (Stage 2) contra Prisma/SQLite. Mismo patrón que `PrismaProductoRepository`.
@Injectable()
export class PrismaVarianteRepository implements VarianteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(variante: Variante): Promise<void> {
    const props = variante.toProps();
    const datos = {
      productoId: props.productoId,
      sku: props.sku,
      codigoBarras: props.codigoBarras,
      atributos: props.atributos,
    };

    await this.prisma.variante.upsert({
      where: { id: props.id },
      update: datos,
      create: { id: props.id, ...datos },
    });
  }

  async buscarPorId(id: string): Promise<Variante | null> {
    const fila = await this.prisma.variante.findFirst({ where: { id, deletedAt: null } });
    return fila ? this.aDominio(fila) : null;
  }

  async existeSku(sku: string): Promise<boolean> {
    const fila = await this.prisma.variante.findFirst({ where: { sku, deletedAt: null } });
    return fila !== null;
  }

  private aDominio(fila: VarianteFila): Variante {
    return Variante.crear({
      id: fila.id,
      productoId: fila.productoId,
      sku: fila.sku,
      codigoBarras: fila.codigoBarras,
      atributos: fila.atributos as Atributos,
    });
  }
}
