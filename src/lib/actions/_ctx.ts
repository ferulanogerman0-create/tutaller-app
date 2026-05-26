// Shared tenant context helper para server actions
// Importar y usar `const u = await ctx()` al inicio de cada action.
// Usar `u.tenantId` en todas las queries (WHERE) y `tenantId: u.tenantId` en INSERTs.
import 'server-only';
import { getSessionUser, type CurrentUser } from '@/lib/auth';

export async function ctx(): Promise<CurrentUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('not authenticated');
  return u;
}

export async function ctxAdmin(): Promise<CurrentUser> {
  const u = await ctx();
  if (u.role !== 'owner' && u.role !== 'admin') throw new Error('unauthorized: admin required');
  return u;
}
