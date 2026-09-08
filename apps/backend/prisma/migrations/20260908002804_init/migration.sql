-- CreateTable
CREATE TABLE "categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria_padre_id" TEXT,
    "tipo_cotizacion_default_id" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "categoria_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "categoria" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "categoria_tipo_cotizacion_default_id_fkey" FOREIGN KEY ("tipo_cotizacion_default_id") REFERENCES "tipo_cotizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "atributo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_dato" TEXT NOT NULL,
    CONSTRAINT "atributo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "marca_id" TEXT,
    "unidad_medida_base" TEXT NOT NULL,
    "moneda_costo" TEXT NOT NULL DEFAULT 'ARS',
    "costo" REAL NOT NULL DEFAULT 0,
    "tipo_cotizacion_id" TEXT,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "producto_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marca" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "producto_tipo_cotizacion_id_fkey" FOREIGN KEY ("tipo_cotizacion_id") REFERENCES "tipo_cotizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "variante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producto_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "atributos" JSONB NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "variante_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "deposito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "stock" (
    "variante_id" TEXT NOT NULL,
    "deposito_id" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 0,
    "punto_reposicion" REAL NOT NULL DEFAULT 0,

    PRIMARY KEY ("variante_id", "deposito_id"),
    CONSTRAINT "stock_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_deposito_id_fkey" FOREIGN KEY ("deposito_id") REFERENCES "deposito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variante_id" TEXT NOT NULL,
    "deposito_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "motivo" TEXT,
    "usuario_id" TEXT NOT NULL,
    "referencia_tipo" TEXT,
    "referencia_id" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimiento_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimiento_deposito_id_fkey" FOREIGN KEY ("deposito_id") REFERENCES "deposito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "compra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedor_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "total" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "detalle_compra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compra_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "costo_unitario" REAL NOT NULL,
    CONSTRAINT "detalle_compra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compra" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "detalle_compra_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "dni_cuit" TEXT,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "rol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "permiso" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "rol_id" TEXT NOT NULL,
    "permiso_codigo" TEXT NOT NULL,

    PRIMARY KEY ("rol_id", "permiso_codigo"),
    CONSTRAINT "rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rol_permiso_permiso_codigo_fkey" FOREIGN KEY ("permiso_codigo") REFERENCES "permiso" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lista_precio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "precio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lista_precio_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "vigente_desde" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" DATETIME,
    CONSTRAINT "precio_lista_precio_id_fkey" FOREIGN KEY ("lista_precio_id") REFERENCES "lista_precio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "precio_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero_correlativo" INTEGER NOT NULL,
    "cliente_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "subtotal" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "impuestos" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "venta_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "venta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venta_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "descuento_unitario" REAL NOT NULL DEFAULT 0,
    "tipo_cotizacion_id" TEXT,
    "valor_cotizacion_usado" REAL,
    CONSTRAINT "detalle_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "detalle_venta_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "detalle_venta_tipo_cotizacion_id_fkey" FOREIGN KEY ("tipo_cotizacion_id") REFERENCES "tipo_cotizacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metodo_pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venta_id" TEXT NOT NULL,
    "metodo_pago_id" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    CONSTRAINT "pago_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pago_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodo_pago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tipo_cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "historial_cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo_cotizacion_id" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "fecha_hora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuente" TEXT NOT NULL,
    CONSTRAINT "historial_cotizacion_tipo_cotizacion_id_fkey" FOREIGN KEY ("tipo_cotizacion_id") REFERENCES "tipo_cotizacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comprobante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "referencia_tipo" TEXT NOT NULL,
    "referencia_id" TEXT NOT NULL,
    "contenido_snapshot" JSONB NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "trabajo_impresion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comprobante_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimo_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trabajo_impresion_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orden_servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente_id" TEXT NOT NULL,
    "tecnico_id" TEXT,
    "equipo" TEXT NOT NULL,
    "problema" TEXT NOT NULL,
    "diagnostico" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'recibido',
    "fecha_ingreso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" DATETIME,
    "presupuesto" REAL,
    "mano_obra" REAL,
    CONSTRAINT "orden_servicio_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orden_servicio_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "detalle_orden_servicio_repuesto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orden_servicio_id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    CONSTRAINT "detalle_orden_servicio_repuesto_orden_servicio_id_fkey" FOREIGN KEY ("orden_servicio_id") REFERENCES "orden_servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "detalle_orden_servicio_repuesto_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "configuracion_negocio" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "nombre" TEXT NOT NULL DEFAULT '',
    "cuit" TEXT,
    "direccion" TEXT,
    "ancho_ticket" INTEGER NOT NULL DEFAULT 80,
    "carpeta_backup" TEXT,
    "umbral_cotizacion_vencida_horas" INTEGER NOT NULL DEFAULT 24
);

-- CreateTable
CREATE TABLE "backup_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "variante_sku_key" ON "variante"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "variante_codigo_barras_key" ON "variante"("codigo_barras");

-- CreateIndex
CREATE INDEX "movimiento_variante_id_deposito_id_idx" ON "movimiento"("variante_id", "deposito_id");

-- CreateIndex
CREATE INDEX "movimiento_fecha_idx" ON "movimiento"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_usuario_key" ON "usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "venta_numero_correlativo_key" ON "venta"("numero_correlativo");

-- CreateIndex
CREATE INDEX "venta_fecha_idx" ON "venta"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_cotizacion_nombre_key" ON "tipo_cotizacion"("nombre");

-- CreateIndex
CREATE INDEX "historial_cotizacion_tipo_cotizacion_id_fecha_hora_idx" ON "historial_cotizacion"("tipo_cotizacion_id", "fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- Índice único parcial: solo puede haber un precio ACTIVO (vigente_hasta
-- NULL) por combinación lista_precio + variante. Prisma no expresa índices
-- parciales en schema.prisma (ver apps/backend/prisma/README.md) — se
-- agrega a mano en esta primera migración.
CREATE UNIQUE INDEX "precio_activo_unico" ON "precio"("lista_precio_id", "variante_id") WHERE "vigente_hasta" IS NULL;
