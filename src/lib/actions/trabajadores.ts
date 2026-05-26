'use server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { ctx, ctxAdmin, getSlug } from './_ctx';

export async function listTrabajadores() {
  const u = await ctx();
  return db.select().from(schema.users)
    .where(eq(schema.users.tenantId, u.tenantId))
    .orderBy(schema.users.nombre);
}

export async function createTrabajador(formData: FormData) {
  const u = await ctxAdmin();
  const slug = await getSlug();
  const username = String(formData.get('username') || '').trim().toLowerCase();
  const nombre = String(formData.get('nombre') || '').trim();
  const email = String(formData.get('email') || '').trim() || null;
  const role = String(formData.get('role') || 'mecanico') as 'admin' | 'mecanico' | 'recepcion' | 'contable';
  const password = String(formData.get('password') || '');

  if (!username || !nombre || !password) throw new Error('campos requeridos');
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(schema.users).values({ tenantId: u.tenantId, username, nombre, email, role, passwordHash, activo: true });
  revalidatePath(`/${slug}/dashboard/trabajadores`);
}

export async function updateTrabajador(id: number, formData: FormData) {
  const u = await ctxAdmin();
  const slug = await getSlug();
  const nombre = String(formData.get('nombre') || '').trim();
  const email = String(formData.get('email') || '').trim() || null;
  const role = String(formData.get('role') || 'mecanico') as 'admin' | 'mecanico' | 'recepcion' | 'contable';
  const activo = formData.get('activo') === 'on';
  const password = String(formData.get('password') || '');

  const patch: Partial<typeof schema.users.$inferInsert> = { nombre, email, role, activo };
  if (password) patch.passwordHash = await bcrypt.hash(password, 10);

  await db.update(schema.users).set(patch)
    .where(and(eq(schema.users.id, id), eq(schema.users.tenantId, u.tenantId)));
  revalidatePath(`/${slug}/dashboard/trabajadores`);
}

export async function toggleTrabajadorActivo(id: number) {
  const u = await ctxAdmin();
  const slug = await getSlug();
  const rows = await db.select().from(schema.users)
    .where(and(eq(schema.users.id, id), eq(schema.users.tenantId, u.tenantId)))
    .limit(1);
  if (!rows[0]) return;
  await db.update(schema.users).set({ activo: !rows[0].activo })
    .where(and(eq(schema.users.id, id), eq(schema.users.tenantId, u.tenantId)));
  revalidatePath(`/${slug}/dashboard/trabajadores`);
}
