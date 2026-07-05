# SOPA — Resumen de traspaso

## Proyecto
ERP SaaS para hostelería. Monorepo pnpm en `/Users/ernestoguerra/Claude/SOPA`.

## Stack
- **API**: NestJS
- **Web**: Next.js 15 (App Router)
- **DB**: Prisma + PostgreSQL (Supabase)
- **Diseño**: glassmorphism "dark cinema" — blobs animados, glow, stagger fade-ins

## Repo
- https://github.com/ernestoguerra21/sopa
- Rama `main`, último commit `029fe40`

## Producción (desplegado y verificado)

| Componente | URL | Notas |
|---|---|---|
| Web | https://sopa-web-khaki.vercel.app | Vercel, autodeploy en cada push |
| API | https://sopa-api-4o1j.onrender.com | Render, autodeploy, tier free (duerme tras 15min sin tráfico) |
| DB | Supabase PostgreSQL | pooler eu-west-1 |

**Login demo**: `gerente@demo.com` / `demo1234` (o `dueno@demo.com`)

## Arquitectura clave
El navegador solo habla con Vercel. `next.config.ts` proxya `/api/*` hacia el API de Render vía la env var `API_URL`, evitando CORS. En local, el proxy apunta a `http://localhost:3001`.

## Módulos completos
Los 6 del sidebar, todos funcionales:
- **Centro de operaciones** — dashboard con ventas/gastos/beneficio/alertas
- **Tareas**
- **RRHH** — empleados
- **Inventario** — con steppers +/-
- **Compras** — pedidos que al "recibir" suman stock a Inventario vía transacción Prisma
- **Proveedores**

## Responsive
Implementado. Sidebar se convierte en drawer móvil por debajo de 860px, con topbar + botón hamburguesa.

## Desarrollo local

```bash
cd SOPA
DATABASE_URL="postgresql://postgres.tiavngmzwuqxfzwuvilt:Beyondthewall90%2A@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" node apps/api/dist/apps/api/src/main.js  # API :3001
pnpm --filter web dev  # o preview_start "SOPA Web" → :3000
```

> ⚠️ Rotar esa contraseña de Supabase en algún momento — quedó expuesta en el chat.

## Pendiente / posibles siguientes fases
- Auth con permisos por rol (OWNER/MANAGER/SUPERVISOR hoy no restringen nada)
- Alertas de stock bajo generadas automáticamente (hoy son registros estáticos, no reactivas a cantidad)
- Edición inline de empleados/inventario (hoy solo alta/baja/toggle)
- Reportes o exportación de datos
- Tests automatizados (no hay ninguno todavía)
