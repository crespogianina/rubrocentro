import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Variante, VarianteInvalidaError } from '../../domain/variante.entity.js';
import type { Atributos } from '../../domain/variante.entity.js';
import { PRODUCTO_REPOSITORY } from '../ports/producto-repository.port.js';
import type { ProductoRepository } from '../ports/producto-repository.port.js';
import { VARIANTE_REPOSITORY } from '../ports/variante-repository.port.js';
import type { VarianteRepository } from '../ports/variante-repository.port.js';

export interface CrearVarianteInput {
  productoId: string;
  sku: string;
  codigoBarras: string | null;
  atributos?: Atributos;
}

@Injectable()
export class CrearVarianteUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepository: ProductoRepository,
    @Inject(VARIANTE_REPOSITORY)
    private readonly varianteRepository: VarianteRepository,
  ) {}

  async ejecutar(input: CrearVarianteInput): Promise<Variante> {
    if (!(await this.productoRepository.buscarPorId(input.productoId))) {
      throw new VarianteInvalidaError(`No existe el producto "${input.productoId}".`);
    }
    if (await this.varianteRepository.existeSku(input.sku)) {
      // Regla de negocio: el SKU identifica la variante de forma única
      // (ver docs/ARQUITECTURA.md, "Modelo de datos — primera versión").
      throw new VarianteInvalidaError(`Ya existe una variante con el SKU "${input.sku}".`);
    }

    const variante = Variante.crear({ id: randomUUID(), ...input });
    await this.varianteRepository.guardar(variante);
    return variante;
  }
}
