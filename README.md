# SOPA — Sistema Operativo Para Administradores

ERP SaaS para hostelería. Monorepo pnpm: NestJS API + Next.js web + Prisma/PostgreSQL.

## Desarrollo local

```bash
pnpm install
cp .env.example packages/database/.env   # pon tu DATABASE_URL de Supabase
pnpm --filter @sopa/database generate
pnpm --filter @sopa/database exec prisma db push
pnpm --filter @sopa/database seed
pnpm dev   # API :3001 + web :3000
```

Credenciales demo: `gerente@demo.com` / `demo1234`

## Deploy

| Pieza | Servicio | Cómo |
|-------|----------|------|
| API | Render | New → Blueprint → este repo (usa `render.yaml`). Añade `DATABASE_URL` cuando lo pida. |
| Web | Vercel | Import repo → Root Directory: `apps/web` → env `API_URL` = URL del API en Render |
| DB | Supabase | Proyecto PostgreSQL. Usa la **Session pooler URI** (IPv4) como `DATABASE_URL`. |

El navegador solo habla con Vercel; `/api/*` se proxya al API de Render (sin CORS en prod).
