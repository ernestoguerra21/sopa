# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SOPA (Sistema Operativo Para Administradores) — a multi-tenant ERP SaaS for the hospitality industry (Cuba/Spain focus). Domain, UI copy, and most code comments are in Spanish; keep new user-facing text and comments in Spanish to match.

pnpm monorepo with three workspaces:
- `apps/api` — NestJS backend
- `apps/web` — Next.js 15 (App Router) frontend
- `packages/database` — Prisma schema/client shared by both, published as `@sopa/database`

## Commands

```bash
pnpm install
cp .env.example packages/database/.env       # set DATABASE_URL (Supabase Session pooler URI for local)
pnpm --filter @sopa/database generate        # generate Prisma client — rerun after any schema.prisma change
pnpm --filter @sopa/database exec prisma db push
pnpm --filter @sopa/database seed            # seeds demo tenant/org/business/users

pnpm dev                                     # API :3001 + web :3000 concurrently
pnpm build                                   # database -> api -> web, in that order (dependency order matters)

pnpm db:generate / db:migrate / db:seed / db:studio   # shortcuts for the packages/database scripts above
```

Per-workspace:
```bash
pnpm --filter api dev            # nest start --watch
pnpm --filter api build          # nest build
pnpm --filter web dev            # next dev
pnpm --filter database migrate:dev / migrate:deploy
```

Tests (only `apps/api/src/payroll/cuba-calculator.test.ts` exists today, using node's built-in test runner — no Jest):
```bash
pnpm --filter api test                                   # node --test src/**/*.test.ts
node --test apps/api/src/payroll/cuba-calculator.test.ts  # run a single file directly
```
There is no test suite for the web app or for API controllers/services — don't assume one exists.

Local infra alternative to Supabase: `docker-compose.yml` brings up Postgres 17 + Redis (Redis isn't wired into any code yet).

## Architecture

### Data hierarchy and tenancy

`Tenant` (login/auth boundary for `User` records, 1:1 with `Organization`) → `Organization` → `Business` (many per organization). **`Business` is the real data isolation boundary today** — inventory, employees, tasks, time entries, suppliers, purchase orders, sales, alerts, payroll, and time-off all key off `businessId` (plus a redundant `tenantId` carried through from the top-level tenant). When adding a new domain model, give it both `tenantId` and `businessId` with indexes on each, following the existing models in `packages/database/prisma/schema.prisma`.

### Two session kinds sharing one JWT shape

Login (`apps/api/src/auth/auth.service.ts`) checks the `User` table first, then the `Employee` table, and issues a JWT with a `kind` field:
- `kind: "user"` — managers/owners. Carries `organizationRoles`, `businessRoles`, `businessIds` in the payload. The frontend must send an `X-Business-Id` header (from `localStorage.sopa_business_id`, set by the sidebar business switcher) on every request; `apps/web/src/lib/api.ts`'s `request()` attaches it automatically.
- `kind: "employee"` — hourly/shift workers, authenticate against `Employee.email`/`password` directly (not `User`). Their `businessId` is fixed to their own employee record and resolved server-side without needing the header. They're routed to `/(worker)/fichar` (the clock-in page), outside the admin dashboard layout.

`JwtStrategy` (`apps/api/src/auth/jwt.strategy.ts`) just decodes the payload; `BusinessContextGuard` (`apps/api/src/auth/business-context.guard.ts`) is what actually resolves `req.businessId` per request:
- employee sessions: looks up their fixed `businessId`.
- user sessions with an org-wide role (`OWNER`/`ADMIN_ORG`): may request any business belonging to their organization via the header; guard verifies the business's org matches the user's tenant.
- other user sessions: the requested business must be in their `businessIds` (from `BusinessMember`); otherwise 403, even if the header is spoofed.

### Permissions

`apps/api/src/auth/permissions.ts` defines the `Permission` union and two static maps, `ORGANIZATION_ROLE_PERMISSIONS` and `BUSINESS_ROLE_PERMISSIONS`, keyed by the `OrganizationRole` and `BusinessRole` enums. `PermissionsGuard` unions the permissions granted by all of a user's org + business roles and checks them against `@RequirePermissions(...)` set on a controller method. Only `OWNER` has `roles.manage` (reassigning roles); `ADMIN_ORG` can invite/remove members but not change roles — this is intentional, not a bug. Employee sessions have no roles/permissions and generally hit separate endpoints (e.g. clock-in) rather than the guarded admin ones.

Standard controller stack for any admin route:
```ts
@Controller("thing")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class ThingController {
  @Get() @RequirePermissions("thing.view") findAll(@Request() req) {
    return this.thing.findAll(req.businessId);
  }
}
```
Services take `businessId` (and `tenantId` on create) as explicit arguments rather than reading them off a request-scoped context — follow this pattern rather than injecting `REQUEST`.

### Web ↔ API wiring

`apps/web/next.config.ts` rewrites `/api/:path*` to `API_URL` (defaults to `http://localhost:3001` locally). The browser never talks to the API origin directly — in production it only talks to Vercel, which proxies to Render. All frontend data access goes through the single typed client in `apps/web/src/lib/api.ts` (`api.<domain>.<method>`); add new endpoints there rather than calling `fetch` ad hoc from components. `apps/api/src/main.ts` sets a global `api` prefix and reads `CORS_ORIGIN`.

### Payroll (Cuba, Resolución 41/2023)

`apps/api/src/payroll/cuba-calculator.ts` is a pure function implementing Cuban social-security (5% up to 15,000, 10% above) and progressive income-tax brackets (exempt to 3,260, then 3–20% by bracket), verified against the official reference spreadsheet — see the test file for the golden values. All employees are currently treated as MIPYME (pays both SS and income tax); PDL (self-employed, SS-only) isn't implemented. The gross salary itself is computed in `payroll.service.ts` from either summed `TimeEntry.hours * payRate` (hourly) or a fixed monthly `payRate`. The frontend (`apps/web/src/app/(dashboard)/nomina/page.tsx`) duplicates the bracket math client-side for instant preview as a manager edits values before saving — if you change the calculator logic, update both.

### Deployment gotcha

Production `DATABASE_URL` (on Render) must use Supabase's **Transaction pooler** (port 6543) with `?pgbouncer=true&connection_limit=1`, not the Session pooler (port 5432, 15-connection cap) — repeated deploys against the session pooler have exhausted it before (`EMAXCONNSESSION`). Local `.env` can stay on the session pooler since there's only one dev connection at a time. See `render.yaml` for the Render build/start commands and `HANDOFF_NOMINA.md` for the incident writeup.

### Module layout convention

Each `apps/api/src/<feature>/` directory follows `feature.module.ts` / `feature.controller.ts` / `feature.service.ts`, registered in `app.module.ts`. Mirror this for new features rather than introducing a different structure. Request-body validation is inconsistent across the codebase: some routes use `class-validator` DTOs (`apps/api/src/common/dto.ts`), others accept untyped `body: any` — prefer adding a DTO for new money- or date-handling routes, matching the existing `common/dto.ts` ones.
