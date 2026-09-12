import { Injectable } from '@nestjs/common';
import type { Producto as ProductoFila } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Producto, type MonedaCosto } from '../domain/producto.entity.js';
import type { ProductoRepository } from '../application/ports/producto-repository.port.js';

// Adaptador de infraestructura — implementa el puerto `ProductoRepository`
// (Stage 2) contra Prisma/SQLite. Es la única capa que conoce el schema de
// Prisma; el dominio y los casos de uso no lo importan.
@Injectable()
export class PrismaProductoRepository implements ProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(producto: Producto): Promise<void> {
    const props = producto.toProps();
    const datos = {
      nombre: props.nombre,
      categoriaId: props.categoriaId,
      marcaId: props.marcaId,
      unidadMedidaBase: props.unidadMedidaBase,
      monedaCosto: props.monedaCosto,
      costo: props.costo,
    };

    await this.prisma.producto.upsert({
      where: { id: props.id },
      update: datos,
      create: { id: props.id, ...datos },
    });
  }

  async buscarPorId(id: string): Promise<Producto | null> {
    // Soft-delete (`deletedAt`): un producto borrado no es "encontrable"
    // para el dominio, aunque la fila siga en la base.
    const fila = await this.prisma.producto.findFirst({ where: { id, deletedAt: null } });
    return fila ? this.aDominio(fila) : null;
  }

  private aDominio(fila: ProductoFila): Producto {
    return Producto.crear({
      id: fila.id,
      nombre: fila.nombre,
      categoriaId: fila.categoriaId,
      marcaId: fila.marcaId,
      unidadMedidaBase: fila.unidadMedidaBase,
      monedaCosto: fila.monedaCosto as MonedaCosto,
      costo: fila.costo,
    });
  }
}
