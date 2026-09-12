import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import type { DireccionAjuste } from '../../application/use-cases/ajustar-stock.use-case.js';

export class AjustarStockDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  varianteId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  depositoId!: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @ApiProperty({ enum: ['alta', 'baja'] })
  @IsIn(['alta', 'baja'])
  direccion!: DireccionAjuste;

  @ApiProperty({ description: 'Obligatorio — ver docs/ARQUITECTURA.md, "Operaciones críticas".' })
  @IsString()
  @MinLength(1)
  motivo!: string;
}
