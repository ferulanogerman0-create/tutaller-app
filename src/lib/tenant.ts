// Tenant context helpers — TuTaller multi-tenant
import { cookies, headers } from 'next/headers';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';

export type Tenant = typeof schema.tenants.$inferSelect;

const tenantCache = new Map<string, { tenant: Tenant; at: number }>();
const TTL_MS = 60_000;

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = tenantCache.get(slug);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.tenant;
  const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug)).limit(1);
  if (!rows[0]) return null;
  tenantCache.set(slug, { tenant: rows[0], at: Date.now() });
  return rows[0];
}

export async function getTenantById(id: number): Promise<Tenant | null> {
  for (const cached of tenantCache.values()) {
    if (cached.tenant.id === id && Date.now() - cached.at < TTL_MS) return cached.tenant;
  }
  const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)).limit(1);
  if (!rows[0]) return null;
  tenantCache.set(rows[0].slug, { tenant: rows[0], at: Date.now() });
  return rows[0];
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const h = await headers();
  const tenantId = h.get('x-tenant-id');
  if (tenantId) return getTenantById(Number(tenantId));
  return null;
}

export async function requireCurrentTenant(): Promise<Tenant> {
  const t = await getCurrentTenant();
  if (!t) throw new Error('No tenant context (middleware misconfigured or call outside tenant route)');
  if (!t.activo) throw new Error(`Tenant ${t.slug} desactivado (plan vencido o suspendido)`);
  return t;
}

export function invalidateTenantCache(slug?: string) {
  if (slug) tenantCache.delete(slug);
  else tenantCache.clear();
}
