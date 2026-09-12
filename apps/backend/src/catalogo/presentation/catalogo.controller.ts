import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CrearProductoUseCase } from '../application/use-cases/crear-producto.use-case.js';
import { CrearVarianteUseCase } from '../application/use-cases/crear-variante.use-case.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { CrearVarianteDto } from './dto/crear-variante.dto.js';
import { ProductoResponseDto } from './dto/producto-response.dto.js';
import { VarianteResponseDto } from './dto/variante-response.dto.js';

// Sin lógica propia (ver docs/ARQUITECTURA.md, "Flujo de una request") —
// solo mapea DTOs a los casos de uso de Stage 2. Sin @RequierePermiso: el
// catálogo de permisos (prisma/seed.ts) no tiene un código para "crear
// producto/variante" — a diferencia de "productos:eliminar", el alta de
// catálogo es una tarea operativa habitual, no restringida por rol; solo
// exige estar autenticado.
@ApiTags('catalogo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('productos')
export class CatalogoController {
  constructor(
    private readonly crearProducto: CrearProductoUseCase,
    private readonly crearVariante: CrearVarianteUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: ProductoResponseDto })
  async crear(@Body() dto: CrearProductoDto): Promise<ProductoResponseDto> {
    const producto = await this.crearProducto.ejecutar({
      nombre: dto.nombre,
      categoriaId: dto.categoriaId,
      marcaId: dto.marcaId ?? null,
      unidadMedidaBase: dto.unidadMedidaBase,
      monedaCosto: dto.monedaCosto,
      costo: dto.costo,
    });
    return producto.toProps();
  }

  @Post(':productoId/variantes')
  @ApiCreatedResponse({ type: VarianteResponseDto })
  async crearVarianteDeProducto(
    @Param('productoId') productoId: string,
    @Body() dto: CrearVarianteDto,
  ): Promise<VarianteResponseDto> {
    const variante = await this.crearVariante.ejecutar({
      productoId,
      sku: dto.sku,
      codigoBarras: dto.codigoBarras ?? null,
      atributos: dto.atributos,
    });
    return variante.toProps();
  }
}
