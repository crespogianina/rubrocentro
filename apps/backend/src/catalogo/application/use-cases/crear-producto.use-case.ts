import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Producto, type MonedaCosto } from '../../domain/producto.entity.js';
import { PRODUCTO_REPOSITORY } from '../ports/producto-repository.port.js';
import type { ProductoRepository } from '../ports/producto-repository.port.js';

export interface CrearProductoInput {
  nombre: string;
  categoriaId: string;
  marcaId: string | null;
  unidadMedidaBase: string;
  monedaCosto: MonedaCosto;
  costo: number;
}

@Injectable()
export class CrearProductoUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepository,
  ) {}

  async ejecutar(input: CrearProductoInput): Promise<Producto> {
    const producto = Producto.crear({ id: randomUUID(), ...input });
    await this.productoRepository.guardar(producto);
    return producto;
  }
}
