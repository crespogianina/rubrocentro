import { Module } from '@nestjs/common';
import { PrismaStockRepository } from './infrastructure/prisma-stock.repository.js';
import { STOCK_REPOSITORY } from './application/ports/stock-repository.port.js';
import { RegistrarMovimientoUseCase } from './application/use-cases/registrar-movimiento.use-case.js';
import { AjustarStockUseCase } from './application/use-cases/ajustar-stock.use-case.js';
import { StockController } from './presentation/stock.controller.js';

@Module({
  controllers: [StockController],
  providers: [
    RegistrarMovimientoUseCase,
    AjustarStockUseCase,
    { provide: STOCK_REPOSITORY, useClass: PrismaStockRepository },
  ],
})
export class StockModule {}
