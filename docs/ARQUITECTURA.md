# RubroCero — Arquitectura

> Export en Markdown del documento de análisis completo (4 rondas de revisión). La versión con formato vive en [este artifact](https://claude.ai/code/artifact/162f2771-1a34-447b-9900-475ccdf400a8) — este archivo es la fuente de verdad para el desarrollo porque viaja con el código y no depende de un link externo.

Decisiones ya tomadas, vigentes en todo este documento:

- Un local por instalación (sin multi-sucursal desde el día uno)
- Modelo de negocio: multi-instalación del mismo producto genérico, sin SaaS/multi-tenant todavía
- Facturación electrónica ARCA/AFIP: pospuesta, no es parte del MVP
- Rubro piloto: un local de informática (computadoras, notebooks, componentes, periféricos, accesorios, insumos)
- Arquitectura: monolito modular hexagonal — Electron + Angular + NestJS + Prisma + SQLite

---

## Parte I — Diagnóstico de mercado y bases

### 01. Resumen ejecutivo

El mercado argentino de gestión de stock está polarizado entre ERPs contables grandes (Tango, Xubio, Softland) que tratan el stock como módulo secundario de la facturación, y soluciones verticales armadas a medida de un rubro puntual (corralones, librerías). Casi nadie ofrece un **núcleo genérico configurable** — un motor de stock que un local de informática, una librería y un corralón puedan usar cada uno con su propia configuración, sin reescribir el modelo de datos por cliente.

La apuesta de RubroCero: un núcleo común (productos, depósitos, movimientos, proveedores) más una capa de **atributos configurables** que absorbe lo específico de cada rubro, sin tocar el esquema base. App de escritorio instalable, SQLite local (funciona sin internet), integración liviana a APIs de cotización del dólar.

### 02. Qué hay hoy en el mercado

| Categoría | Ejemplos | Dónde flaquean |
|---|---|---|
| ERP contable con stock incluido | Tango, Xubio, Softland, Colppy | El stock es secundario a la facturación; personalizar por rubro exige módulos pagos aparte |
| Vertical armado para un rubro | Software para corralones (Dux, Flexxus), software para librerías | Resuelven un rubro muy bien pero no sirven para otro sin reescritura casi total |
| Suites internacionales genéricas | Zoho Inventory, Odoo, MRPeasy, Holded | Completas pero sobredimensionadas, no contemplan AFIP/ARCA ni la dinámica peso/dólar local |

Patrón repetido: el precio del primer mes no es el dato que importa — las suscripciones se ajustan con inflación y a 5 años pueden superar ampliamente una licencia perpetua.

Piso funcional ya esperado por el mercado: control multi-depósito, códigos de barra, alertas de stock mínimo, órdenes de compra/venta, ajustes y transferencias, reportes en tiempo real, integración contable/fiscal.

### 03. Núcleo común vs. lo específico de cada rubro

| Necesidad | Núcleo | Informática | Librería | Corralón |
|---|---|---|---|---|
| SKU / código de barras | ✓ | ✓ | ✓ | ✓ |
| Stock por depósito, alertas de mínimo | ✓ | ✓ | ✓ | ✓ |
| Proveedores y órdenes de compra | ✓ | ✓ | ✓ | ✓ |
| Variantes ricas | – | baja | ✓ crítico | media |
| Unidades fraccionadas (peso/volumen) | – | – | – | ✓ crítico |
| N° de serie / garantía | – | ✓ crítico | – | – |
| Precio de referencia en USD | – | ✓ | baja | ✓ |
| Cuenta corriente mayorista | – | media | ✓ (colegios) | ✓ (obras) |
| Estacionalidad marcada | – | baja | ✓ (vuelta a clases) | media |
| Entregas parciales | – | – | – | ✓ |

### 04. Modelo de datos — primera versión

Patrón "atributos configurables + variantes" (el mismo que usa Odoo): un producto base, atributos que cada rubro define por categoría, y las combinaciones generan las variantes reales con stock. Entidades iniciales: `Producto`, `Atributo`, `Variante` (SKU), `Depósito`, `Movimiento`, `Proveedor`, `Lista de precios`, `Cotización`.

### 05. Arquitectura para el MVP (primera versión)

Con un local por instalación, sin multi-sucursal, sin ARCA: no hace falta servidor propio. UI en Angular dentro de Electron → proceso principal habla con SQLite local → instalador nativo con electron-builder.

### 06. Comparativa de stacks de escritorio

| Opción | Veredicto |
|---|---|
| **Electron + Angular** | Recomendado para el MVP — reusa Angular de CloudPOS, sin problema de CORS, ecosistema maduro |
| .NET MAUI | Alternativa si se suma backend — aprovecha .NET de CloudPOS, pero curva de aprendizaje en desktop y menor madurez en Linux/Mac |
| Tauri | Optimización a futuro — instalador chico y bajo RAM, pero la parte nativa es Rust, stack nuevo |

### 07. Integración con la cotización del dólar

APIs candidatas gratuitas sin key: [DolarAPI](https://dolarapi.com/docs/) (oficial/blue/bolsa/CCL/mayorista de una) y [ArgentinaDatos](https://argentinadatos.com/docs/operations/get-cotizaciones-dolares) como respaldo. Estrategia: guardar la última cotización con timestamp, refrescar al abrir la app y con botón manual, seguir operando con el último valor cacheado si no hay internet — nunca bloquear una venta por esto.

### 08. Roadmap por fases (versión inicial)

Fase 0 (fundamentos) → Fase 1 (MVP del núcleo) → Fase 2 (rubro piloto real) → Fase 3 condicional (multi-sucursal / productización).

### 09. Preguntas abiertas de la Parte I

Qué rubro usar de piloto (resuelto: informática); uso propio vs. producto (resuelto en Parte IV: Opción B, multi-instalación); un dólar de referencia único o varios (resuelto en Parte IV: catálogo abierto).

---

## Parte II — Arquitectura técnica completa

### 10. Requerimientos y alcance

**Roles (versión inicial):** Administrador, Vendedor/Cajero, Depósito (opcional).

**Funcionales:** ABM de productos/categorías/atributos, movimientos (venta/compra/ajuste/transferencia), alertas de stock mínimo, proveedores y órdenes de compra, listas de precios con referencia a USD, consulta/actualización de cotización, usuarios y roles, reportes, backup/restauración.

**No funcionales:** operar sin internet salvo cotización, venta confirmada en <1-2s, instalación sin conocimientos técnicos, ningún movimiento se pierde ante cierre inesperado, todo movimiento auditable por usuario, actualizar de versión sin perder datos.

**Casos de uso principales:** vender, comprar, ajustar stock, transferir entre depósitos, alertar y sugerir orden de compra, actualizar cotización y recalcular precios, alta de usuario, backup/restore.

**Escenarios futuros a contemplar sin construir ahora:** más de un depósito, múltiples locales sincronizados, RubroCero como producto de terceros, ARCA, impresión de tickets.

### 11. Arquitectura de software

| Alternativa | ¿Recomendada? | Por qué |
|---|---|---|
| Microservicios | No | Resuelve un problema de escala y equipos grandes que este proyecto no tiene |
| Capas clásicas sin fronteras | No sola | Termina con la UI hablando directo con la base |
| Monolito sin modularizar | No así | Difícil de mantener apenas crece a 4-5 features |
| **Monolito modular + Clean/Hexagonal** | **Sí** | Un solo proceso para instalar, con frontera clara entre reglas de negocio e infraestructura |

**Módulos:** `catalogo`, `stock`, `compras`, `precios`, `cotizaciones`, `identidad`, `reportes`, `backups` — cada uno con su propio domain/application/infrastructure/presentation.

### 12. Estructura del proyecto

```
rubrocero/
├── apps/
│   ├── backend/     # NestJS — domain/application/infrastructure/presentation por módulo
│   ├── frontend/    # Angular — core/shared/layout/features
│   └── desktop/     # Electron — main, preload, empaquetado
└── packages/
    └── shared-types/  # DTOs compartidos
```

Regla de dependencia: `domain` no importa nada de `infrastructure` ni de Nest; `application` orquesta `domain` a través de puertos; `infrastructure` implementa esos puertos; `presentation` es la única capa que sabe que existe HTTP.

### 13. Base de datos — primera versión

SQLite para el MVP (sin proceso servidor, un solo archivo); PostgreSQL como destino si hay multi-sucursal/SaaS (soporta JSONB, sin costo de licencia). ORM: Prisma (portable entre los dos motores). Entidades base: producto, atributo, variante, depósito, stock, movimiento, proveedor, usuario. Reglas: movimientos inmutables (jamás hard delete), soft delete en todo lo demás, timestamps en UTC, auditoría mínima con usuario_id obligatorio en cada movimiento.

### 14. Backend

NestJS (Node/TypeScript) por sobre sumar .NET: mantener todo en TypeScript de punta a punta es más barato de sostener para un desarrollador solo, y NestJS calca el estilo de Angular (módulos, DI, decoradores). API REST versionada (`/api/v1`) desde el día uno — en el MVP escucha solo en `127.0.0.1`, pero pasar a remoto el día de mañana es cambiar una URL, no reescribir nada.

**Flujo de una request:** Angular → middleware de logging → Guard de autenticación (JWT) → Guard de roles → Pipe de validación (DTO) → Controller (sin lógica) → caso de uso (aplica reglas + transacción) → filtro de errores global → interceptor de logging.

**Auth:** argon2 + JWT corto. **Autorización:** roles fijos vía Guard. **Config:** variables de entorno. **Docs:** Swagger/OpenAPI. **Rate limiting:** no aplica mientras la API es local.

### 15. Frontend

Angular. `core/` (AuthService, Guards, interceptores), `features/*` (un módulo por dominio, lazy-loaded). Estado con signals + servicios (sin NgRx). Reactive Forms. Permisos en UI son solo cosméticos — el control real vive en el backend.

### 16. Instalación en la máquina del cliente

| Alternativa | ¿Recomendada? |
|---|---|
| Docker / Docker Compose | No — exige Docker Desktop, rompe "doble clic e instalar" |
| Instalación tradicional manual | No — cada paso manual es un punto de falla |
| Web app en servidor/cloud | No todavía — depende de internet estable, no encaja con "un local por instalación" |
| **Instalador de escritorio (Electron + backend embebido)** | **Sí** |

Instalador único (electron-builder/NSIS): copia frontend + backend (ejecutable auto-contenido, sin instalar Node aparte) y corre migraciones de Prisma en el primer arranque creando la base + usuario Admin inicial. Backups automáticos dentro de la app. SQLite en modo WAL + transacciones ante cortes de luz/crashes. Logs rotados exportables. Desinstalar nunca borra la carpeta de datos por defecto.

### 17. Ambientes

Development (SQLite local con seed), Testing (CI, SQLite efímera), Staging (canal beta del propio instalador, no un servidor aparte), Production (una base SQLite aislada por instalación).

### 18. Seguridad

| Medida | ¿Necesaria ahora? |
|---|---|
| Hash de contraseñas (argon2) | Sí |
| JWT con expiración corta | Sí |
| Validación de inputs / queries parametrizadas | Sí |
| contextIsolation + preload en Electron | Sí |
| Secretos vía .env | Sí |
| `npm audit` / Dependabot | Sí |
| Rate limiting | No todavía (API solo en 127.0.0.1) |
| CORS restrictivo multi-origen | No todavía |
| Cifrado de la base de datos | No todavía |

### 19. Testing

Unit (casos de uso/dominio) y integration (repositorios contra SQLite de prueba) en cada push; E2E (Playwright) de los flujos críticos solo antes de cada release. El objetivo no es cobertura alta en número — es blindar los casos donde un bug significa "vendí algo que no tenía stock" o "perdí un movimiento".

### 20. Deployment y CI/CD

Trunk-based simplificado (GitFlow completo es más proceso del que un equipo de una persona necesita): `main` siempre desplegable, ramas cortas, PR con CI obligatorio. Tag de versión → electron-builder empaqueta → electron-updater distribuye. Rollback: como cada instalación tiene su propia base local, nunca afecta a otro cliente.

### 21. Escalabilidad y mantenimiento

**Ahora:** atributos configurables, puertos/adaptadores, API versionada, ORM portable, roles + auditoría básica. **Después:** multi-tenant real, caché distribuido, colas de mensajes, permisos granulares, particionamiento de base. El crecimiento más probable no es "más requests por segundo" sino "más instalaciones independientes".

### 22. Costos

| Ítem | MVP | Producción robusta (Fase 3) |
|---|---|---|
| Servidor | $0 | ~USD 10-25/mes |
| Base de datos | $0 (SQLite) | ~USD 10-15/mes (Postgres administrado) |
| Backups | $0 (carpeta local/Drive) | ~USD 1-5/mes (object storage) |
| Certificado de firma de código | Opcional, ~USD 100-250/año | Igual |
| Monitoreo | $0 (logs locales) | Plan gratuito de Sentry al principio |

### 23. Plan de implementación (visión general)

Setup del monorepo → schema + migraciones → domain/application (sin HTTP) → infrastructure → presentation (API) → base de Angular → primer feature end-to-end (plantilla) → resto de features → empaquetado Electron → testing E2E → documentación de instalación. El detalle tarea por tarea vive en `TASKS.md`.

### 24. Decisión final de la Parte II

Stack: Angular + NestJS + Prisma + SQLite + Electron. Arquitectura: monolito modular hexagonal. Sin microservicios ni Windows Service en esta ronda.

---

## Parte III — Revisión con requisitos reales (informática)

### Qué cambió, qué se mantuvo, qué se descartó

- **Se mantiene:** stack completo, monolito hexagonal, roles + permisos nombrados en backend, backup 3-2-1, auto-inicio sin Windows Service.
- **Cambia:** el modelo de datos crece de verdad (ventas, clientes, marcas, comprobantes, servicio técnico, auditoría); la impresión se resuelve como módulo de infraestructura propio.
- **Se descarta:** backend como Windows Service, impresión desde el navegador, un servicio de impresión separado, Docker en el cliente.

### 25. Usuarios, roles y permisos

| Rol | Ve | Crea/modifica | Elimina | Operaciones sensibles | Info. financiera |
|---|---|---|---|---|---|
| Administrador | Todo | Todo | Todo (soft-delete) | Anular ventas, restaurar backups, cambiar roles | Costos, márgenes, reportes completos |
| Encargado | Todo salvo usuarios | Productos, precios, compras, clientes | Productos/proveedores | Anular ventas, ajustes de stock | Costos y márgenes sí |
| Vendedor | Catálogo, stock, precio de venta | Ventas, clientes nuevos | Nada | Ninguna | Solo precio de venta |
| Técnico | Órdenes de servicio, stock de componentes | Órdenes de servicio | Nada | Ninguna | Nada |

Autorización siempre en el backend (Guards por permiso nombrado, ej. `ventas:anular`), nunca solo ocultando botones en el frontend. Permisos por usuario individual (más allá del rol): no para el MVP.

### 26. Sistema de impresión

| Alternativa | ¿Recomendada? |
|---|---|
| Imprimir desde el navegador | No — sin ESC/POS, sin impresión silenciosa confiable |
| Servicio local de impresión aparte | No, no aparte — duplicaría lo que el backend ya puede resolver |
| **Electron con impresión resuelta en el backend** | **Sí** |

Puerto `ImpresoraPort` con adaptadores térmico (ESC/POS por USB/serie) y convencional (spooler de Windows). Cola de trabajos con reintentos — la venta se confirma independientemente de que el ticket se imprima. Reimpresión reenvía un snapshot congelado, nunca regenera con datos actuales.

### 27. Disponibilidad y arranque automático

Se evaluó backend como Windows Service y se descartó para un solo terminal: suma un componente instalable/actualizable por separado sin un segundo consumidor que lo necesite. En su lugar: Electron se agrega a la carpeta de Inicio de Windows y levanta el backend como proceso hijo. Condición explícita para revisar esto: el día que se sume un segundo terminal en red.

### 28. Modelo de datos ampliado

Se agregan: `cliente`, `marca`, `venta`/`detalle_venta`/`pago` (documento de negocio, separado de `movimiento`), `compra`/`detalle_compra`, `comprobante` (snapshot congelado), `orden_servicio` (rol Técnico), `usuario`, `auditoria`, `trabajo_impresion`, `configuracion_negocio`. `movimiento` se extiende con `referencia_tipo`/`referencia_id` apuntando al documento que lo originó.

### 29. Estrategia de backup (3-2-1)

3 copias, 2 soportes, 1 fuera del local: base activa + copia local diaria (disco/pendrive) + copia cloud (Drive/OneDrive/Backblaze). Retención: 14 diarias + 6 mensuales. Verificación de integridad (`PRAGMA integrity_check`) después de cada backup — un backup corrupto sin verificar es peor que no tener backup. Dashboard siempre visible: "Último backup: hace X horas ✓".

### 30. Instalación en el cliente, paso a paso

Instalador único sin dependencias sueltas → asistente inicial dentro de la app (datos del negocio, usuario Admin, carpeta de backup, detección e impresión de prueba de impresoras) → carga de categorías/marcas/proveedores/productos → alta de Vendedor → primera venta imprime un ticket. Actualizaciones: electron-updater silencioso con migraciones automáticas.

### 31. Operaciones críticas

| Operación | Permiso | Auditoría |
|---|---|---|
| Registrar venta | Vendedor+ | Implícita (usuario en el registro) |
| Anular venta | Encargado/Admin | Sí, con motivo |
| Ajuste manual de stock | Encargado/Admin | Sí, siempre |
| Modificar precio | Encargado/Admin | Sí — valor anterior y nuevo |
| Eliminar producto | Admin | Sí (soft-delete) |
| Modificar usuarios/permisos | Admin | Sí, siempre |

### 32. Auditoría

Genera auditoría: cambios de precio, anulaciones, devoluciones, ajustes de stock, eliminaciones, alta/cambio de usuarios y permisos, restauración de backup, configuración fiscal. No genera auditoría: lecturas, búsquedas, navegación.

### 33. Arquitectura final (segunda confirmación)

Ningún requisito de esta ronda empujó hacia una arquitectura distinta — todos se resolvieron dentro del diseño ya elegido, a nivel de modelo de datos y módulos.

### 34-35. Clasificación de decisiones y propuesta A-K

Ver la tabla de clasificación (obligatorio/recomendado/opcional/no todavía) y el roadmap MVP → Fase 2 → Fase 3 condicional en la sección equivalente de la Parte IV (35), que los actualiza.

---

## Parte IV — Segunda revisión (producto futuro, cotizaciones, auditoría de base de datos)

### Qué cambió, qué se mantuvo, qué se descartó

- **Se mantiene:** todo el stack y la arquitectura de la Parte III.
- **Cambia:** categoría pasa a ser jerárquica explícita; precio pasa de campo mutable a tabla versionada; rol/permiso pasan a catálogos en base; cotización pasa de "oficial vs. blue" a catálogo abierto con historial; se define autenticación completa; se define la estrategia de crecimiento a producto.
- **Se descarta:** SaaS multi-tenant ahora, recuperación de contraseña por email en el MVP, actualización automática de precios al cambiar la cotización.

### 36. Diagnóstico

**Estaba bien:** el núcleo genérico, el stack, la arquitectura hexagonal, local-first, backup 3-2-1, roles con autorización en backend. **Estaba mal/incompleto:** precio mutable sin historial, cotización como valor único, rol como string implícito, sin categoría explícita. **Faltaba:** detalle de compra, diseño de autenticación, decisión uso propio/producto/SaaS, registro de verificación de backups.

### 37. Uso propio, producto o SaaS

| Opción | Qué implica | ¿Ahora? |
|---|---|---|
| A. Instalación única | Sin ningún concepto de "empresa" en el esquema | Insuficiente |
| **B. Multi-instalación, sin multi-tenant** | Mismo código genérico, una instalación por cliente, cada uno con su SQLite aislado | **Recomendada** |
| C. SaaS multi-tenant | `empresa_id` en casi todas las tablas, Postgres, aislamiento por fila/schema, facturación, panel de clientes | Prematuro |

**Barato de decidir ahora:** nada de "informática" hardcodeado, precio versionado, rol/permiso como catálogo, cotización como catálogo abierto, ORM portable. **Caro solo si se hace mal, no por esperar:** `empresa_id`, panel de licencias, facturación por suscripción, aislamiento multi-tenant a nivel de query.

### 38. Cotización del dólar: modelo y comportamiento

A mediados de 2026 siguen siendo relevantes oficial, blue, MEP, CCL y mayorista — no alcanza un selector binario. Catálogo abierto: `tipo_cotizacion` + `historial_cotizacion` (append-only). La categoría define un tipo de cotización por defecto; el producto puede sobreescribirlo. **El precio no se actualiza solo** al cambiar la cotización: el sistema calcula un precio sugerido y aplicarlo es una acción explícita y auditada. El valor de cotización usado se congela siempre en cada línea de venta. Predeterminado: dólar oficial a nivel sistema.

### 39. Roles y permisos (confirmación)

Se confirma roles + permisos nombrados, ahora modelados como catálogos en base (`rol`, `permiso`, `rol_permiso`) en vez de strings — el MVP sigue viniendo con 4 roles fijos precargados.

### 40. Autenticación y sesiones

Usuario + contraseña (no exige email por empleado). Hash argon2. JWT de acceso corto (30-60 min) + refresh (7 días) en almacenamiento seguro del SO. Expiración por inactividad configurable. **Recuperación de contraseña: no por email en el MVP** — el Admin resetea desde Configuración (una app local-first no debería depender de un servidor de correo). Sin 2FA/SSO/OAuth por ahora.

### 41. Impresión — confirmación con Tauri

Tauri se descarta también para impresión: su núcleo es Rust, haría falta un plugin en Rust o un sidecar en Node, perdiendo la ventaja de "liviano" sin ganar nada que Electron no dé ya.

### 42. Offline / local-first

| Funciona sin internet | Requiere internet |
|---|---|
| Ventas, stock, productos, clientes | Actualizar la cotización del dólar |
| Impresión de tickets y comprobantes | Backup en la nube |
| Consulta de historial y reportes | Actualizaciones de la app |
| Login (valida contra la base local) | Servicios externos futuros (ARCA) |

Sin conexión se usa la última cotización cacheada, con fecha/hora siempre visible; nunca se bloquea una venta por esto; pasado un umbral configurable (24hs por defecto) el indicador cambia de color como aviso, sin impedir vender.

### 43. Backups — comparación de medios

Pendrive: solo como extra. Disco externo: sí, como copia local. NAS: sobredimensionado para este tamaño. Google Drive/OneDrive: sí, como copia cloud (el cliente suele ya tenerlo). Backblaze: alternativa si no tiene Drive/OneDrive (~USD 5-7/mes).

### 44. Modelo de datos — auditoría completa

Se agregan: `categoria` jerárquica explícita, `rol`/`permiso`/`rol_permiso`, `metodo_pago` (catálogo, no enum), `precio` versionado con vigencia, `detalle_compra` (faltaba, simétrico a `detalle_venta`), `backup_log`. `detalle_venta` incorpora `tipo_cotizacion_id` y `valor_cotizacion_usado` congelados.

### 45. Auditoría e historial

Se agrega como evento auditable: un recálculo masivo de precios disparado por cambio de cotización (quién, sobre qué categoría/proveedor, cuántos productos) — no cada actualización de valor de mercado, que ya vive en `historial_cotizacion`.

### 46. Ventas y consistencia transaccional

Una venta es una única transacción: `venta` + `detalle_venta` (con descuento/impuesto por línea) + `pago` (uno o varios métodos) + `movimiento` de baja de stock por línea + `comprobante`. Si cualquier paso falla, toda la transacción se revierte. Anulación cambia el estado y genera movimientos de reversión — la venta original nunca se edita ni se borra. Cambios de precio posteriores no afectan ventas ya cerradas.

### 47. Arquitectura general — comparación final

Confirmada por tercera vez: Electron + Angular + NestJS local + SQLite. Ningún requisito de esta ronda (multi-instalación futura, cotizaciones múltiples, auth completa, ventas transaccionales) empujó hacia una arquitectura distinta.

### 48. Qué desacoplar para un producto futuro

| | MVP | Fase 2 | Futuro |
|---|---|---|---|
| Modelo de negocio | Instalación única, informática | Más instalaciones (Opción B) | SaaS multi-tenant (Opción C), si se justifica |
| Categorías/atributos | Configurables por categoría | Plantillas por rubro | Marketplace de plantillas |
| Cotización | Catálogo + default por categoría | Override por proveedor | Motor de reglas de precio configurable |
| Roles | 4 roles fijos precargados | Alta de roles desde la UI | Permisos por usuario individual |
| Terminales | Uno, local | — | Multi-terminal LAN, Windows Service |

### 49. Entregable final consolidado

Ver tabla de decisión al principio de este archivo y `README.md` / `TASKS.md` para el resumen operativo y el plan de trabajo tarea por tarea.

---

## Fuentes consultadas durante el análisis

- [MRPeasy — Mejor software de gestión de inventarios 2026](https://www.mrpeasy.com/blog/es/el-mejor-software-de-gestion-de-inventarios/)
- [Wynges — Top 10 software de gestión en Argentina](https://wynges.com/blog/top-10-software-zeus-flexus-softland-xubio-tango-bejerman-contagram-colppy-nubox/)
- [Wynges — Software para papelerías y librerías](https://wynges.com/blog/mejores-software-papeleria-libreria-argentina/)
- [Dux Software — Gestión para corralones y ferreterías](https://duxsoftware.com.ar/software-de-gestion-para-corralones-ferreterias)
- [Loggro — Inventario con atributos: variantes de producto](https://loggro.com/blog/articulo/inventario-con-atributos-como-tu-pos-gestiona-variantes-de-producto-desde-un-solo-sistema/)
- [PkgPulse — Best desktop app frameworks 2026](https://www.pkgpulse.com/guides/best-desktop-app-frameworks-2026)
- [DolarAPI — Documentación](https://dolarapi.com/docs/)
- [ArgentinaDatos — Cotizaciones de dólares](https://argentinadatos.com/docs/operations/get-cotizaciones-dolares)
- [Commercy — Los 7 mejores ERP para pymes en Argentina](https://commercy.com.ar/blog/mejores-erp-argentina)
- [Dolarito.ar — Cotización del dólar hoy](https://www.dolarito.ar/cotizacion/dolar-hoy)
