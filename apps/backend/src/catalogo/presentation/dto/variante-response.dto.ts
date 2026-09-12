import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Atributos } from '../../domain/variante.entity.js';

export class VarianteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productoId!: string;
  @ApiProperty() sku!: string;
  @ApiPropertyOptional({ nullable: true }) codigoBarras!: string | null;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) atributos!: Atributos;
}
