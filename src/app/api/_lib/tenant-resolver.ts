// Server-side tenant resolver — para usar en server components y API routes
// Lee header `x-tenant-slug` seteado por middleware + cachea tenant en memoria
import { headers } from 'next/headers';
import { getTenantBySlug } from '@/lib/tenant';
import type { Tenant } from '@/lib/tenant';

export async function resolveTenantFromHeaders(): Promise<Tenant | null> {
  const h = await headers();
  const slug = h.get('x-tenant-slug');
  if (!slug) return null;
  return getTenantBySlug(slug);
}

export async function requireTenantFromHeaders(): Promise<Tenant> {
  const t = await resolveTenantFromHeaders();
  if (!t) throw new Error('No tenant slug in headers');
  if (!t.activo) throw new Error(`Tenant ${t.slug} desactivado`);
  return t;
}
