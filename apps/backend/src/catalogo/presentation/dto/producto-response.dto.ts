import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MonedaCosto } from '../../domain/producto.entity.js';

export class ProductoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() categoriaId!: string;
  @ApiPropertyOptional({ nullable: true }) marcaId!: string | null;
  @ApiProperty() unidadMedidaBase!: string;
  @ApiProperty({ enum: ['ARS', 'USD'] }) monedaCosto!: MonedaCosto;
  @ApiProperty() costo!: number;
}
