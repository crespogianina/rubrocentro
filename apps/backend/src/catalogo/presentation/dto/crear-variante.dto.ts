import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import type { Atributos } from '../../domain/variante.entity.js';

export class CrearVarianteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  codigoBarras?: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsOptional()
  @IsObject()
  atributos?: Atributos;
}
