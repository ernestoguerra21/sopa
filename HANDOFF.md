# SOPA — Resumen de traspaso

## Proyecto
ERP SaaS para hostelería, multi-negocio. Monorepo pnpm en `/Users/ernestoguerra/Claude/SOPA`.

## Stack
- **API**: NestJS
- **Web**: Next.js 15 (App Router)
- **DB**: Prisma + PostgreSQL (Supabase)
- **Diseño**: glassmorphism "dark cinema" — blobs animados, glow, stagger fade-ins

## Repo
- https://github.com/ernestoguerra21/sopa
- Rama `main`, último commit `96d9c2b`

## Producción (desplegado y verificado)

| Componente | URL | Notas |
|---|---|---|
| Web | https://sopa-web-khaki.vercel.app | Vercel, autodeploy en cada push |
| API | https://sopa-api-4o1j.onrender.com | Render, autodeploy, tier free (duerme tras 15min sin tráfico) |
| DB | Supabase PostgreSQL | pooler eu-west-1 |

**Login admin demo**: `gerente@demo.com` / `demo1234` (ADMIN_ORG+MANAGER) o `dueno@demo.com` / `demo1234` (OWNER)
**Login trabajador demo**: `lucia@demo.com` / `lucia1234` (fichaje por hora, redirige a `/fichar`)

## Arquitectura clave

**Proxy**: el navegador solo habla con Vercel. `next.config.ts` proxya `/api/*` hacia el API de Render vía `API_URL`. En local, apunta a `http://localhost:3001`.

**Jerarquía de datos**: `Tenant` (auth de `User`, límite superior, ya no filtra datos) → `Organization` (1:1 con Tenant) → `Business` (varios por organización — **este es el aislamiento real de datos hoy**). Cada `Business` tiene su propio inventario, empleados, tareas, fichajes, proveedores, compras, ventas y alertas.

**Dos tipos de sesión** (JWT `kind`):
- `kind: "user"` — gerentes/dueños. Login con email/password contra tabla `User`. Necesitan header `X-Business-Id` en cada petición (el frontend lo adjunta solo desde `localStorage.sopa_business_id`, gestionado por el selector de negocio del sidebar).
- `kind: "employee"` — trabajadores. Login con email/password contra tabla `Employee` (campos propios, no `User`). Su `businessId` es fijo (el suyo), se resuelve automático sin necesitar el header. Redirige a `/fichar` (fuera del layout admin).

**Permisos**: `Permission` (union de ~20 strings) + `@RequirePermissions(...)` + `PermissionsGuard`, resuelto como unión de `OrganizationRole` (OWNER/ADMIN_ORG/FINANCE_MANAGER/HR_MANAGER/READ_ONLY) + `BusinessRole` (MANAGER/OPERATIONS_MANAGER/INVENTORY_MANAGER/SUPERVISOR/STAFF/READ_ONLY) del usuario. Solo `OWNER` puede cambiar roles (`roles.manage`); `ADMIN_ORG` puede invitar/eliminar usuarios pero no reasignar roles — es deliberado, no bug.

**BusinessContextGuard**: resuelve `req.businessId` en cada petición admin. Valida que el usuario tenga acceso al negocio pedido (via `BusinessMember` directo, o vía rol de organización OWNER/ADMIN_ORG que da acceso a todos los negocios de su org). 403 si intenta acceder a un negocio ajeno, incluso falsificando el header.

## Módulos completos (sidebar)
- **Centro de operaciones** — dashboard con ventas/gastos/beneficio/alertas
- **Tareas** — asignables a `User` (gerentes) o a `Employee` (trabajadores, campo `employeeAssigneeId`)
- **RRHH** — empleados, organigrama (por departamento y jerárquico), **Fichajes** (el admin solo edita/corrige in-place, ya no puede fichar — eso lo hace el trabajador desde `/fichar` con cronómetro play/pausa/stop si es tarifa por hora, o botón de día si no)
- **Inventario** — steppers +/-
- **Compras** — pedidos que al "recibir" suman stock a Inventario vía transacción Prisma
- **Proveedores**
- **Usuarios** — invitar/editar rol/eliminar miembros de la organización (por negocio)
- **Negocios** — crear/renombrar/eliminar negocios dentro de la organización (bloquea eliminar el único negocio, o uno con datos dentro)

## Responsive
Implementado. Sidebar se convierte en drawer móvil por debajo de 860px, con topbar + botón hamburguesa.

## Desarrollo local

```bash
cd SOPA
DATABASE_URL="postgresql://postgres.tiavngmzwuqxfzwuvilt:Beyondthewall90%2A@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" node apps/api/dist/apps/api/src/main.js  # API :3001
pnpm --filter web dev  # o preview_start "SOPA Web" → :3000
```

Tras cambiar `schema.prisma`: `pnpm --filter @sopa/database exec prisma db push` (puede pedir `--accept-data-loss` para columnas nuevas nullable — es un falso positivo si no hay `NOT NULL` nuevo sin backfill).

> ⚠️ Rotar la contraseña de Supabase en algún momento — quedó expuesta en el chat.

## Pendiente / posibles siguientes fases
- Mover tareas/inventario existentes entre negocios desde la UI (hoy solo se crean directamente en el negocio activo)
- Alertas de stock bajo generadas automáticamente (hoy son registros estáticos, no reactivas a cantidad)
- Edición inline de empleados/inventario (hoy solo alta/baja/toggle)
- Reportes o exportación de datos
- Tests automatizados (no hay ninguno todavía)
- Motor de nómina Cuba (Resolución 41/2023) — se mencionó en un prompt externo, no implementado; requiere la hoja de cálculo/documentación de referencia que no se ha compartido
