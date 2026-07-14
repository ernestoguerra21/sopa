# Alpaka ERP — Resumen de traspaso

Documento vivo: al terminar cada sesión relevante, actualízalo (no lo dejes desincronizado). Última actualización: commit `8eab9eb`.

## Qué es

ERP SaaS multi-negocio para hostelería, enfocado en Cuba (nómina según Resolución 41/2023). Antes se llamaba "SOPA", ahora **Alpaka ERP** (rebrand: logo de alpaca naranja, tema oscuro con acento naranja `#f97316`/`#ea580c`, glasmorfismo).

## Stack y repo

- Monorepo pnpm: `apps/api` (NestJS), `apps/web` (Next.js 15 App Router), `packages/database` (Prisma).
- DB: PostgreSQL en Supabase, pooler `eu-west-1`.
- Repo: https://github.com/ernestoguerra21/sopa, rama `main`, autodeploy en cada push.
- Hosting: web en Vercel (https://sopa-web-khaki.vercel.app), API en Render (`srv-d954hg7avr4c739tp7p0`, https://sopa-api-4o1j.onrender.com, tier free — duerme tras 15 min sin tráfico).
- Proxy: el navegador solo habla con Vercel; `apps/web/next.config.ts` reenvía `/api/*` al API vía `API_URL` (local: `http://localhost:3001`).

**Login demo**: `gerente@demo.com` / `demo1234` (ADMIN_ORG+MANAGER), `dueno@demo.com` / `demo1234` (OWNER). Trabajador: revisar `Employee.email` en la BD, redirige a `/fichar`.

⚠️ **La contraseña de Supabase quedó expuesta en texto plano en el historial de git de este archivo (commits antiguos).** Pendiente rotarla — hasta entonces, tratar el `DATABASE_URL` como potencialmente comprometido.

## Comandos

```bash
pnpm dev                                              # API + web en paralelo
pnpm --filter web build                               # build producción web
pnpm --filter api build                                # build producción api (nest build)
pnpm --filter api test                                 # tests (node:test nativo, sin framework)
pnpm --filter database generate                        # regenerar Prisma client tras tocar schema
cd packages/database && npx prisma db push --skip-generate --accept-data-loss   # aplicar schema a Supabase
```

**Ojo con el dev server**: si corres `pnpm --filter web build` (build de producción) mientras el dev server de Next sigue corriendo, se corrompe la caché `.next` y el server empieza a tirar `Cannot find module './XXX.js'`. Fix: parar el server, `rm -rf apps/web/.next`, reiniciar.

**API local**: si lo arrancas manual con `node dist/apps/api/src/main.js`, acuérdate de matar el proceso viejo (`lsof -ti:3001`) y reconstruir (`pnpm --filter api build`) antes, o sigues sirviendo código desactualizado.

## Arquitectura de datos (19 modelos, `packages/database/prisma/schema.prisma`)

Aislamiento multi-tenant: **todo** modelo operativo lleva `tenantId` + `businessId` obligatorios. Jerarquía: `Tenant` (auth de `User`, límite superior histórico) → `Organization` (1:1 con Tenant) → `Business[]` (varios por organización — **este es el aislamiento real de datos hoy**). Cada `Business` tiene su propio inventario, empleados, tareas, fichajes, proveedores, compras, ventas y alertas.

**Dos tipos de sesión** (JWT `kind`):
- `kind: "user"` — gerentes/dueños, login contra tabla `User`. Necesitan header `X-Business-Id` en cada petición (el frontend lo adjunta desde `localStorage.sopa_business_id`, gestionado por el selector de negocio del sidebar).
- `kind: "employee"` — trabajadores, login contra tabla `Employee` (campos propios, no `User`). Su `businessId` es fijo, se resuelve automático. Redirige a `/fichar` (layout distinto, sin acceso al dashboard admin).

RBAC de dos niveles:
- `OrganizationRole`: OWNER, ADMIN_ORG, FINANCE_MANAGER, HR_MANAGER, READ_ONLY
- `BusinessRole`: MANAGER, OPERATIONS_MANAGER, INVENTORY_MANAGER, SUPERVISOR, STAFF, READ_ONLY
- Guards en cadena: `JwtAuthGuard` → `BusinessContextGuard` (resuelve `req.businessId`, 403 si el usuario no tiene acceso al negocio pedido) → `PermissionsGuard` (`@RequirePermissions("recurso.accion")`, ver `apps/api/src/auth/permissions.ts`)
- Solo `OWNER` puede cambiar roles (`roles.manage`); `ADMIN_ORG` puede invitar/eliminar usuarios pero no reasignar roles — es deliberado, no bug.

Modelos: Tenant, InventoryItem, **StockMovement** (nuevo), User, Organization, Business, OrganizationMember, BusinessMember, Employee, Department, TimeEntry, Task, SalesEntry, Alert, Supplier, PurchaseOrder, PurchaseOrderItem, PayrollRecord, TimeOff.

**RLS activado en las 19 tablas de Supabase** (commit `287e6fd`). La app nunca usa `supabase-js` — solo Prisma con el rol `postgres` (`BYPASSRLS=true`, verificado), así que esto no afecta al backend, solo cierra el endpoint público PostgREST que Supabase expone por defecto. Si algún día se añade una tabla nueva, **hay que activarle RLS a mano** (`ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;`) o quedará expuesta.

## Módulos implementados

| Módulo | Ruta admin | Estado |
|---|---|---|
| Dashboard | `/dashboard` | Ventas/gastos del día, alertas, tareas del día |
| Tareas | `/tasks` | CRUD, prioridad, asignable a `User` (gerentes) o `Employee` (trabajadores) |
| RRHH | `/rrhh` | Empleados (ficha completa, apellidos+carnet 11 dígitos obligatorios), organigrama, fichajes (solo edición admin — fichar lo hace el trabajador) |
| Nómina | `/nomina` | Cálculo Cuba (SS + IIP), edición manual, recibo PDF imprimible (ventana nueva, fondo blanco forzado) |
| Vacaciones | `/vacaciones` | Solicitud (trabajador) → aprobación (admin) → calendario mensual |
| Inventario | `/inventario` | **Movimientos de stock con historial + alerta automática de mínimo (nuevo)** |
| Compras | `/compras` | Órdenes a proveedor, recepción incrementa stock + registra movimiento COMPRA |
| Proveedores | `/proveedores` | CRUD básico |
| Usuarios | `/usuarios` | Gestión de miembros y roles org/business |
| Negocios | `/negocios` | CRUD de Business dentro de la Organization |
| Fichaje trabajador | `/fichar` (worker layout) | Cronómetro play/pause/stop (tarifa por hora) o botón de día, solicitud de vacaciones |

## Lo que se hizo en las últimas sesiones (orden cronológico)

1. **Nómina Cuba completa** + recibo PDF (ventana nueva, fondo blanco forzado — el enfoque con overlay/CSS falló, salía negro o en blanco).
2. **Fix crítico de deploy**: Render fallaba por `EMAXCONNSESSION` — el `DATABASE_URL` apuntaba al Session Pooler de Supabase (puerto 5432, límite 15 conexiones). Cambiado a Transaction Pooler (puerto 6543) + `?pgbouncer=true&connection_limit=1`.
3. **Vacaciones y ausencias**: modelo `TimeOff`, flujo solicitud→aprobación, calendario admin.
4. **Rebrand a Alpaka ERP**: logo vectorial de alpaca (`components/AlpakaLogo.tsx`), tema oscuro + acento naranja (el usuario probó tema claro primero y pidió volver al oscuro), formularios responsive (`.form-row` en `globals.css`: dos columnas desktop, apilado móvil, inputs 16px en móvil para evitar auto-zoom iOS).
5. **Auditoría estructural** (a petición del usuario) → plan de 5 pasos para "ERP altamente funcional":
   - ✅ **Paso 1 — Fundaciones**: `ValidationPipe` global + DTOs con `class-validator` en rutas de dinero/fechas (nómina, ventas, fichajes, vacaciones, inventario). 7 tests del cálculo de nómina Cuba (`node:test` nativo, verificados contra Excel oficial). `SalesEntry.sales/expenses`: `Float` → `Decimal`.
   - ✅ **Paso 2 — Inventario con movimientos + alertas**: modelo `StockMovement` (ENTRADA/SALIDA/MERMA/AJUSTE/COMPRA), `registerMovement()` centraliza todo cambio de stock (actualiza cantidad + deja rastro + dispara `Alert` LOW_STOCK al cruzar el mínimo, deduplicada). Recepción de compras registra movimiento COMPRA automáticamente. UI: panel expandible por producto con historial y formulario. Verificado end-to-end en navegador.
   - ⬜ **Paso 3 — Precios en compras + cierre de caja** (siguiente, ver abajo)
   - ⬜ **Paso 4 — Cierre de período de nómina + auditoría**
   - ⬜ **Paso 5 — Reportes/exportaciones, saldos de vacaciones, recurrencia de tareas**
6. **Fix de seguridad crítico**: Supabase marcaba las 19 tablas como públicamente accesibles (RLS desactivado → expuestas vía PostgREST sin autenticación, incluyendo `User.password`). Activado RLS en todas, verificado que no rompe Prisma (`rolbypassrls=true` en el rol `postgres`).

## Plan pendiente (diagnóstico completo, para retomar)

**Transversal**
- ~~Validación de entrada~~ ✅ hecho (paso 1)
- Tests: solo cubierto el cálculo de nómina, falta el resto
- ~~Dinero en Float~~ ✅ `SalesEntry` migrado a Decimal
- **Auditoría**: falta `AuditLog` (quién/qué/cuándo/valor anterior) — nadie registra quién editó una nómina o aprobó una ausencia
- **Paginación**: ningún listado la tiene — con histórico largo de fichajes/ventas se romperá

**Por módulo — pendiente**
- **Dashboard**: solo día actual, falta series temporales (semana/mes, comparativa) y cierre de caja formal e inmutable
- **Tareas**: falta recurrencia (limpieza semanal, inventario mensual), comentarios/historial, notificación al asignado
- **RRHH**: falta vista de ficha completa del empleado (fichajes+nóminas+ausencias juntos), documentos adjuntos, alerta de vencimiento de contrato (`CONTRACT_EXPIRING` existe en el enum pero nada la dispara)
- **Nómina**: falta cierre de período (mes pagado no debería ser editable), exportación en lote, histórico en la ficha del empleado, soporte real de `PayrollCountry.ESPANA` (el enum existe, la lógica no)
- **Vacaciones**: falta saldo de días por trabajador, detección de solapamientos, notificación al aprobar/rechazar, cancelación por el trabajador de una solicitud pendiente
- **Inventario**: base ya sólida (movimientos + alertas). Falta: coste unitario y valoración del inventario
- **Compras**: **falta precios en las órdenes** — hoy solo cantidades, no se sabe cuánto se gastó; sin esto el "beneficio estimado" del dashboard ignora el coste real. Falta también recepción parcial.
- **Proveedores**: falta historial de órdenes por proveedor, catálogo de productos con precio
- **Usuarios/Negocios**: falta invitación por email (hoy el admin fija la contraseña directamente — inseguro), transferencia de registros entre negocios
- **Reportes**: módulo inexistente — mínimo viable: CSV de ventas/nóminas/inventario, P&L mensual simple

**Siguiente paso recomendado**: Paso 3 — precios en compras + cierre de caja, porque cierra el círculo financiero (sin costes reales de compra, el P&L y el "beneficio estimado" del dashboard son ficticios).

## Notas de estilo/UX a respetar

- Tema oscuro con acento naranja — decisión explícita del usuario tras probar tema claro.
- Glasmorfismo: `.glass`/`.glass-lg` en `globals.css`, blobs animados de fondo.
- Logo: `components/AlpakaLogo.tsx` — `AlpakaHead` (solo cabeza) y `AlpakaLogo({ showText: true })` (lockup completo). Ya calibrado sobre el logo original que dio el usuario; no regenerar el SVG sin motivo.
- Formularios responsive: usar `.form-row` para filas de 2 campos (apila en móvil, inputs 16px).
- No usar `Float` para dinero — usar `Decimal` de Prisma.
- Todo endpoint nuevo que mueva dinero o fechas necesita su DTO en `apps/api/src/common/dto.ts` con `class-validator`.
- Todo modelo nuevo en el schema necesita `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` tras el `db push` (ver sección RLS arriba).
