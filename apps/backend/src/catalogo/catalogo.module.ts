import { Module } from '@nestjs/common';
import { PrismaProductoRepository } from './infrastructure/prisma-producto.repository.js';
import { PrismaVarianteRepository } from './infrastructure/prisma-variante.repository.js';
import { PRODUCTO_REPOSITORY } from './application/ports/producto-repository.port.js';
import { VARIANTE_REPOSITORY } from './application/ports/variante-repository.port.js';
import { CrearProductoUseCase } from './application/use-cases/crear-producto.use-case.js';
import { CrearVarianteUseCase } from './application/use-cases/crear-variante.use-case.js';
import { CatalogoController } from './presentation/catalogo.controller.js';

@Module({
  controllers: [CatalogoController],
  providers: [
    CrearProductoUseCase,
    CrearVarianteUseCase,
    { provide: PRODUCTO_REPOSITORY, useClass: PrismaProductoRepository },
    { provide: VARIANTE_REPOSITORY, useClass: PrismaVarianteRepository },
  ],
})
export class CatalogoModule {}
