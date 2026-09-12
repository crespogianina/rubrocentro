import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { MonedaCosto } from '../../domain/producto.entity.js';

export class CrearProductoDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  categoriaId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  marcaId?: string | null;

  @ApiProperty({ example: 'unidad' })
  @IsString()
  @MinLength(1)
  unidadMedidaBase!: string;

  @ApiProperty({ enum: ['ARS', 'USD'] })
  @IsIn(['ARS', 'USD'])
  monedaCosto!: MonedaCosto;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  costo!: number;
}
