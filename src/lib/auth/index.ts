import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const COOKIE = 'tutaller_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type Role = 'owner' | 'admin' | 'mecanico' | 'recepcion' | 'contable';
export type CurrentUser = {
  id: number;
  tenantId: number;
  username: string;
  nombre: string;
  role: Role;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: number, tenantId: number) {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(schema.sessions).values({ id, userId, tenantId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return id;
}

export async function getSessionUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select({
      sessionId: schema.sessions.id,
      tenantId: schema.sessions.tenantId,
      userId: schema.users.id,
      username: schema.users.username,
      nombre: schema.users.nombre,
      role: schema.users.role,
      activo: schema.users.activo,
      userTenantId: schema.users.tenantId,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.activo) return null;
  if (row.tenantId !== row.userTenantId) return null; // session/user tenant mismatch — invalid
  return { id: row.userId, tenantId: row.tenantId, username: row.username, nombre: row.nombre, role: row.role as Role };
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  }
  jar.delete(COOKIE);
}

export async function loginWithCredentials(tenantId: number, username: string, password: string) {
  const rows = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.username, username)))
    .limit(1);
  const user = rows[0];
  if (!user || !user.activo) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await createSession(user.id, tenantId);
  return { id: user.id, tenantId, username: user.username, nombre: user.nombre, role: user.role as Role };
}

// Throws if no session OR session's tenant doesn't match expected tenant
export async function requireSessionInTenant(expectedTenantId: number): Promise<CurrentUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('Unauthorized: no session');
  if (u.tenantId !== expectedTenantId) throw new Error('Forbidden: session tenant mismatch');
  return u;
}

export function canAccess(role: Role, modules: Role[] | 'all'): boolean {
  if (role === 'owner' || role === 'admin') return true;
  if (modules === 'all') return false;
  return modules.includes(role);
}
