# TuTaller.app — Claude Code context

Product FERVOR. SaaS multi-tenant para talleres mecánicos Argentina.
Stack: Next.js 15 + Drizzle ORM + Postgres + n8n + Evolution API (WA) + EasyPanel.
Repo GitHub: `https://github.com/ferulanogerman0-create/tutaller-app`

## Multi-tenancy — regla de oro

**TODA query al DB debe estar scopeada por `tenant_id`.**

- Row-level tenancy: todas las tablas tienen `tenant_id integer NOT NULL references tenants(id)`
- Un bug que olvide el scope = data leak entre talleres = crítico

### En server actions (`src/lib/actions/*.ts`)

```ts
import { ctx, ctxAdmin } from './_ctx';  // NO importar getSessionUser acá

export async function listX() {
  const u = await ctx();  // throw si no auth
  return db.select().from(schema.foo)
    .where(and(eq(schema.foo.tenantId, u.tenantId), /* otras conds */));
}

// INSERT: siempre agregar tenantId
await db.insert(schema.foo).values({ tenantId: u.tenantId, ...data });

// Admin-only:
const u = await ctxAdmin();  // throw si role no es owner/admin
```

### En page server components (`src/app/[slug]/dashboard/*/page.tsx`)

```tsx
export default async function XPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;  // SIEMPRE construir base con slug
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);

  // hrefs SIEMPRE con ${base}/..., NUNCA /dashboard/...
  return <a href={`${base}/clientes`}>Clientes</a>;
}
```

### En client components

```tsx
'use client';
import { useParams } from 'next/navigation';
export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const base = `/${slug}/dashboard`;
}
```

## Routing

Path-based: `app.tutaller.app/{slug}/dashboard/*`

- Middleware `src/middleware.ts`: extrae slug → lookup tenant DB (cache LRU 60s) → inject `x-tenant-id` header
- `getTenantBySlug(slug)` en `src/lib/tenant.ts` (cache 60s en memoria)
- `getCurrentTenant()`: lee header `x-tenant-id` (sólo dentro de middleware scope)
- Login: `/{slug}/login` → redirect a `/{slug}/dashboard`
- Logout: POST `/api/auth/logout?slug={slug}` → redirect a `/{slug}/login`

## Auth

Cookie: `tutaller_session` (30 días).
`getSessionUser()` → `CurrentUser | null` con campos: `{ id, tenantId, username, nombre, role }`.
Roles: `owner | admin | mecanico | recepcion | contable`.
Validación adicional: session.tenantId === user.tenantId (evita cross-tenant session hijack).

## Schema DB (tablas clave)

```
tenants          — slug, nombre, plan (trial/web/bot/enterprise), evo_instance_name, bot_token, activo
users            — tenant_id, username, password_hash, role, activo
sessions         — tenant_id, user_id, expires_at
clientes         — tenant_id, nombre, telefono, telefono_alt, email, dni, cuit
vehiculos        — tenant_id, cliente_id, marca, modelo, año, dominio, vin
ordenes          — tenant_id, cliente_id, vehiculo_id, estado, pago_estado, total
orden_items      — tenant_id, orden_id, descripcion, cantidad, precio_unitario, item_tipo
presupuestos     — tenant_id, cliente_id, vehiculo_id, estado, total
caja_movimientos — tenant_id, tipo (ingreso/egreso), total, categoria, fecha_movimiento
cierres_caja     — tenant_id, total_ingresos, total_egresos, cerrado_por
cuentas_corrientes — tenant_id, cliente_id, saldo
inventario       — tenant_id, nombre, cantidad, precio_costo
turnos           — tenant_id, cliente_id, vehiculo_id, fecha, estado
referidos_codigos — tenant_id, cliente_id, codigo, usos
```

Drizzle schema: `src/lib/db/schema.ts`. Acceso: `import { db, schema } from '@/lib/db'`.

## Archivos clave

```
src/
├── middleware.ts                    — slug extract + tenant lookup + x-tenant-id inject
├── lib/
│   ├── auth/index.ts               — getSessionUser, loginWithCredentials, createSession, destroySession
│   ├── actions/_ctx.ts             — ctx() + ctxAdmin() helpers
│   ├── tenant.ts                   — getTenantBySlug, getCurrentTenant, cache LRU
│   ├── db/schema.ts                — Drizzle schema completo (multi-tenant)
│   ├── db/index.ts                 — db + schema exports
│   └── actions/*.ts                — server actions por dominio (todas deben usar ctx())
└── app/
    ├── page.tsx                    — landing TuTaller.app (placeholder)
    ├── [slug]/
    │   ├── login/page.tsx          — login form → POST /api/auth/login
    │   └── dashboard/
    │       ├── layout.tsx          — sidebar nav con slug-aware hrefs + logout form con ?slug=
    │       ├── page.tsx            — dashboard home (stats)
    │       ├── clientes/           — CRUD clientes
    │       ├── vehiculos/          — CRUD vehiculos
    │       ├── ordenes/            — órdenes de trabajo
    │       ├── presupuestos/       — presupuestos
    │       ├── caja/               — movimientos caja
    │       ├── cierres/            — cierres caja
    │       ├── cuentas-corrientes/ — CC por cliente
    │       ├── finanzas/           — resumen financiero (raw SQL con tenant_id filter)
    │       ├── calendario/         — turnos y calendario
    │       ├── recordatorios/      — recordatorios vehículos
    │       ├── inventario/         — stock
    │       ├── proveedores/        — proveedores
    │       ├── trabajadores/       — usuarios del tenant
    │       ├── referidos/          — sistema referidos con talonario
    │       ├── graficas/           — gráficas estadísticas
    │       ├── informes/           — informes PDF
    │       ├── configuracion/      — config del taller
    │       └── auditoria/          — audit log
    └── api/
        ├── auth/login/route.ts     — POST login credentials
        ├── auth/logout/route.ts    — POST logout → redirect /{slug}/login
        ├── bot/route.ts            — 38 actions multi-tenant (Bearer botToken → tenant lookup)
        └── referidos/[id]/whatsapp/route.ts — enviar mensaje WA referido via Evolution
```

## WhatsApp — Evolution API

URL base: `https://evo.wolfdma.website` (v2.3.7)
Instancia global fallback: env `EVOLUTION_INSTANCE` (= `fma` en prod actual)
Per-tenant futuro: `tenants.evo_instance_name`

Endpoint sendText:
```
POST /message/sendText/{instance}
Headers: apikey: {EVOLUTION_API_KEY}
Body: { number: "5493489231465", text: "mensaje" }
```

Helper: `getTelefonoNormalizado(telefono)` en `src/lib/whatsapp.ts`.

## Bot WA (`/api/bot`)

38 acciones multi-tenant. Auth: Bearer token → busca `tenants WHERE bot_token = token`.
Plan gating: acciones bot-only requieren `plan IN ('bot', 'enterprise')`.
Todas las queries internas scopeadas con el `tenantId` del tenant que matcheó.

## Deploy — EasyPanel

VPS: `31.97.91.237` — EasyPanel v2.24.0 en puerto 3000.
Auth token EasyPanel: `cmpmtq7c600a206s645ufekhe` (header `Authorization: Bearer ...`).
Proyectos existentes: `fervor` (n8n), `fma` (dirup-bot + evolution-api + fma-app + n8n + DBs).

Proyecto a crear: `tutaller`
- Servicio DB: `tutaller-db` (Postgres)
- Servicio app: `tutaller-app` → GitHub `ferulanogerman0-create/tutaller-app`, branch `main`
- Build: Next.js (Nixpacks), PORT=3000

## Variables de entorno requeridas

```env
DATABASE_URL=postgresql://tutaller:PASS@tutaller-db:5432/tutaller
NODE_ENV=production
EVOLUTION_API_URL=https://evo.wolfdma.website
EVOLUTION_API_KEY=<key>
EVOLUTION_INSTANCE=fma
TELEGRAM_BOT_TOKEN=<token>
CRON_SECRET=<min32chars>
BOT_AUTH_TOKEN=<token>
SEED_TENANT_SLUG=fma
SEED_TENANT_NOMBRE=FMA Mecatrónica
SEED_ADMIN_USER=german
SEED_ADMIN_PASS=<pass>
```

## Estado actual (2026-05-26)

### Completado
- Fork fma-app → multi-tenant (`tenant_id` en 18+ tablas)
- Schema Drizzle reescrito completo
- Middleware tenant extract + cache
- Auth reescrito (cookie `tutaller_session`, session con tenantId FK)
- Actions helper `ctx()` / `ctxAdmin()` / `getSlug()`
- **Todas las actions** (`*.ts`): `ctx()` + `eq(table.tenantId, u.tenantId)` + redirects/revalidatePaths slug-aware via `getSlug()`
- **Todas las pages `[slug]/dashboard/*/`**: params slug, `base = /${slug}/dashboard`, hrefs slug-aware, DB queries scopeadas
- Bot `/api/bot` 38 acciones multi-tenant
- Build: 68 routes, 0 errores TypeScript
- GitHub repo: `ferulanogerman0-create/tutaller-app` (branch `master`)
- EasyPanel: proyecto `tutaller`, DB `tutaller-db` (Postgres 17), app `tutaller-app`
- Deploy: Dockerfile build, domain `tutaller-tutaller-app.cedb8a.easypanel.host`
- Migrations + seed corriendo en entrypoint (tenant `fma`, user `german`/`fma1234`)

### Pendiente

**Infra**:
- RLS Postgres (Fase 2.5, opcional)
- `SEED_ADMIN_PASS` env var (default actual: `fma1234`)

**Features pendientes**:
- Landing TuTaller.app real (pricing, signup flow)
- Onboarding flow (signup → create tenant → setup wizard)
- MercadoPago Subscriptions billing
- Evolution instances dinámicas por tenant (plan=bot)
- Import clientes/vehículos CSV

## Convenciones importantes

1. **NUNCA hardcodear `/dashboard/` en hrefs** — siempre `${base}/...`
2. **NUNCA query sin `eq(schema.X.tenantId, ...)`** — data leak
3. Pages async: `{ params: Promise<{ slug: string }> }` (Next.js 15 async params)
4. Client pages: `useParams<{ slug: string }>()` no async params
5. Raw SQL (`db.execute(sql\`...\`)`): agregar `WHERE tenant_id = ${tenantId}` explícito
6. **Actions con redirect/revalidatePath**: usar `const slug = await getSlug()` de `./_ctx` — lee `x-tenant-slug` del middleware header
7. `getSessionUser()` en pages directamente (no via `ctx()` — ese es para actions)
