import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermisosGuard } from '../../common/guards/permisos.guard.js';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator.js';
import type { RequestConUsuario } from '../../common/guards/usuario-autenticado.js';
import { AjustarStockUseCase } from '../application/use-cases/ajustar-stock.use-case.js';
import { AjustarStockDto } from './dto/ajustar-stock.dto.js';
import { MovimientoResponseDto } from './dto/movimiento-response.dto.js';

// Sin lógica propia (ver docs/ARQUITECTURA.md, "Flujo de una request").
// Solo expone el ajuste manual (AjustarStockUseCase) — el registro
// genérico de movimientos (RegistrarMovimientoUseCase, venta/compra/etc.)
// todavía no tiene un caller real vía HTTP: lo van a usar los controllers
// de ventas/compras cuando existan (Stage 7), con su propia autorización
// por tipo. Exponerlo suelto ahora, sin un permiso que lo module, dejaría
// que cualquier usuario autenticado infle stock arbitrariamente.
@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly ajustarStock: AjustarStockUseCase) {}

  @Post('ajustes')
  @RequierePermiso('stock:ajustar')
  @ApiCreatedResponse({ type: MovimientoResponseDto })
  async ajustar(
    @Body() dto: AjustarStockDto,
    @Req() request: RequestConUsuario,
  ): Promise<MovimientoResponseDto> {
    // usuarioId sale del JWT, nunca del body — evita que alguien registre
    // un ajuste "a nombre de" otro usuario.
    const movimiento = await this.ajustarStock.ejecutar({
      varianteId: dto.varianteId,
      depositoId: dto.depositoId,
      cantidad: dto.cantidad,
      direccion: dto.direccion,
      motivo: dto.motivo,
      usuarioId: request.usuarioAutenticado!.sub,
    });
    return movimiento.toProps();
  }
}
