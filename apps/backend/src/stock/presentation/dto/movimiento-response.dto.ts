import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TipoMovimiento } from '../../domain/movimiento.entity.js';

export class MovimientoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() varianteId!: string;
  @ApiProperty() depositoId!: string;
  @ApiProperty({
    enum: ['venta', 'compra', 'ajuste_alta', 'ajuste_baja', 'transferencia', 'devolucion'],
  })
  tipo!: TipoMovimiento;
  @ApiProperty() cantidad!: number;
  @ApiPropertyOptional({ nullable: true }) motivo!: string | null;
  @ApiProperty() usuarioId!: string;
  @ApiPropertyOptional({ nullable: true }) referenciaTipo!: string | null;
  @ApiPropertyOptional({ nullable: true }) referenciaId!: string | null;
  @ApiProperty() fecha!: Date;
}
