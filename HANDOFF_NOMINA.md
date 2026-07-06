# Resumen de sesión — Nómina Cuba + fixes de despliegue

## Contexto del proyecto
- **SOPA**: ERP SaaS para hostelería (Cuba). Monorepo pnpm: `apps/api` (NestJS), `apps/web` (Next.js), `packages/database` (Prisma).
- **Hosting**: web en Vercel, API en Render (`srv-d954hg7avr4c739tp7p0`, https://sopa-api-4o1j.onrender.com), BD en Supabase.
- **Repo**: github.com/ernestoguerra21/sopa, rama `main`, deploy automático al hacer push.

## Lo implementado en esta sesión

### 1. Módulo de nómina (Resolución 41/2023, Cuba)
Basado en el Excel oficial "Hoja de trabajo para cálculo de retenciones":
- **Seguridad Social**: 5% hasta 15.000 + 10% del exceso
- **Impuesto sobre Ingresos Personales**: exento hasta 3.260, luego progresivo 3% / 5% / 7,5% / 10% / 15% / 20% por tramos (hasta 9.510 / 15.000 / 20.000 / 25.000 / 30.000 / resto)
- Todos los empleados se tratan como **MIPYME** (paga SS + Impuesto), no PDL (cuenta propia, solo SS)
- Verificado contra el Excel con salario 70.436,56 → SS 6.293,66, Impuesto 10.174,31 ✓

**Archivos backend:**
- `apps/api/src/payroll/cuba-calculator.ts` — lógica de cálculo pura, con desglose por tramos
- `apps/api/src/payroll/payroll.service.ts` — calcula bruto desde `TimeEntry` (horas × payRate) o `payRate` fijo mensual; genera/persiste/actualiza `PayrollRecord`
- `apps/api/src/payroll/payroll.controller.ts` — endpoints `POST /payroll/calculate/:id`, `POST /payroll/generate/:id`, `GET /payroll`, `PATCH /payroll/:id`, `DELETE /payroll/:id`
- `apps/api/src/payroll/payroll.module.ts`
- Schema: modelo `PayrollRecord` (bruto, deducciones SS/impuesto/otras, total, neto, detalles JSON), único por `(employeeId, month, year)`

**Frontend:**
- `apps/web/src/app/(dashboard)/nomina/page.tsx` — página completa:
  - Selector de trabajador (activos) + mes/año → botón "Generar nómina"
  - Formulario editable por trabajador: bruto, SS, impuesto, otras deducciones — todo ajustable a mano
  - Al cambiar el bruto, recalcula en vivo las retenciones legales y el desglose por tramos (misma lógica que el backend, duplicada en frontend para preview instantáneo vía `onGrossChange` y `breakdownFor`)
  - Botón **"Recibo PDF"**: abre una **ventana nueva** (`window.open` + `document.write`) con un recibo HTML autónomo (plantilla española: empresa pagadora, trabajador, carnet de identidad, devengos, deducciones por concepto con desglose, líquido a percibir, firmas) e imprime. Usa los valores **en vivo del formulario**, no los guardados.
- `apps/web/src/lib/api.ts` — cliente `api.payroll.*` y tipo `PayrollRecord`
- Nav: ítem "Nómina" añadido en el sidebar

### 2. Ficha de empleado — validaciones
`apps/web/src/components/rrhh/EmployeeFormModal.tsx`:
- **Apellidos**: obligatorios
- **Carnet de identidad**: obligatorio, numérico exacto de 11 dígitos (input filtra no-dígitos y trunca a 11; validación `\d{11}` al guardar)
- Recibo de nómina usa "Carnet de identidad" (no "N.I.F.")

### 3. Fix: impresión del recibo salía en negro / en blanco
- Primer intento (overlay + `visibility` CSS) fallaba: salía negro (fondo del tema oscuro) y luego en blanco (visibility no capturaba bien el nodo).
- **Solución final**: `printReceipt()` abre una ventana nueva (`window.open`) con documento HTML propio y fondo blanco garantizado — sin depender de trucos de CSS dentro de la SPA. Función `receiptHtml()` genera el string, con `esc()` para escapar valores.
- Bug relacionado corregido: el botón imprimía el registro guardado (`editing`), no los valores que el operario acababa de escribir. Ahora construye el recibo con los valores en vivo (`fGross`, `fSS`, `fTax`, `fOther`) y recalcula desglose con `breakdownFor()`.

### 4. Fix crítico de despliegue — Render + Supabase
**Síntoma:** deploys de Render fallaban repetidamente (`update_failed`) tras varios pushes seguidos.

**Causa real** (encontrada vía API de Render, logs de tipo `app`):
```
PrismaClientInitializationError: FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```
El `DATABASE_URL` apuntaba al **Session Pooler** de Supabase (puerto 5432, límite 15 conexiones). Reintentos de deploy acumularon conexiones y agotaron el pool.

**Fix aplicado:**
- Cambiado `DATABASE_URL` en Render (vía API, sin exponer el secreto) del Session Pooler (puerto 5432) al **Transaction Pooler** (puerto 6543) + parámetros `?pgbouncer=true&connection_limit=1`
- Verificado: deploy quedó `live`, logs muestran `Nest application started` + `API corriendo en puerto 10000` sin errores de conexión

**Nota para futuras sesiones:** el `.env` local (`packages/database/.env`) sigue en el formato antiguo (puerto 5432). Si se toca la BD localmente no hay problema (menos conexiones concurrentes), pero si se vuelve a desplegar manualmente sin este fix, revisar que `DATABASE_URL` en Render tenga puerto 6543 + esos parámetros.

## Acceso a Render (para esta sesión)
- API key de Render se compartió en el chat para diagnóstico — **considerar rotarlo** si esta transcripción se comparte o persiste, ya que dio acceso de lectura/escritura a env vars y logs.
- Service ID: `srv-d954hg7avr4c739tp7p0`
- Deploy hook: `https://api.render.com/deploy/srv-d954hg7avr4c739tp7p0?key=...` (dispara redeploy, no da logs)

## Pendientes generales del proyecto (de sesiones previas)
- Mover tareas/inventario entre negocios desde la UI
- Alertas de stock bajo automáticas
- Edición inline de empleados/inventario
- Reportes/exportación (CSV/PDF)
- Tests automatizados
- Ampliar nómina: exportar recibos en lote, histórico por trabajador en su ficha

## Comandos útiles
```bash
# Desarrollo
pnpm dev                                    # API + web
pnpm --filter web build                     # build web
pnpm --filter api build                     # build api (usa ./node_modules/.bin/nest)
pnpm --filter database generate             # regenerar Prisma client
cd packages/database && npx prisma db push --skip-generate   # aplicar schema a Supabase
```
