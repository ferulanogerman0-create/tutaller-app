'use server';
import { db, schema } from '@/lib/db';
import { eq, ilike, or, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx, getSlug } from './_ctx';

export async function listVehiculos(query?: string) {
  const u = await ctx();
  if (query && query.length > 0) {
    return await db.select().from(schema.vehiculos)
      .where(and(
        eq(schema.vehiculos.tenantId, u.tenantId),
        or(
          ilike(schema.vehiculos.dominio, `%${query.toUpperCase()}%`),
          ilike(schema.vehiculos.marca, `%${query}%`),
          ilike(schema.vehiculos.modelo, `%${query}%`),
        ),
      ))
      .orderBy(desc(schema.vehiculos.createdAt))
      .limit(100);
  }
  return await db.select().from(schema.vehiculos)
    .where(eq(schema.vehiculos.tenantId, u.tenantId))
    .orderBy(desc(schema.vehiculos.createdAt))
    .limit(100);
}

export async function getVehiculo(id: number) {
  const u = await ctx();
  const rows = await db.select().from(schema.vehiculos)
    .where(and(eq(schema.vehiculos.id, id), eq(schema.vehiculos.tenantId, u.tenantId)))
    .limit(1);
  return rows[0] || null;
}

export async function getVehiculoOrdenes(vehiculoId: number) {
  const u = await ctx();
  return await db.select().from(schema.ordenes)
    .where(and(eq(schema.ordenes.vehiculoId, vehiculoId), eq(schema.ordenes.tenantId, u.tenantId)))
    .orderBy(desc(schema.ordenes.fechaIngreso));
}

export async function createVehiculo(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const dominio = String(formData.get('dominio') || '').trim().toUpperCase();
  if (!dominio) throw new Error('Dominio requerido');
  const clienteId = formData.get('cliente_id');
  const [row] = await db.insert(schema.vehiculos).values({
    tenantId: u.tenantId,
    dominio,
    marca: (formData.get('marca') as string) || null,
    modelo: (formData.get('modelo') as string) || null,
    tipo: (formData.get('tipo') as string) || null,
    color: (formData.get('color') as string) || null,
    anio: formData.get('anio') ? Number(formData.get('anio')) : null,
    kilometraje: formData.get('kilometraje') ? Number(formData.get('kilometraje')) : null,
    combustible: (formData.get('combustible') as string) || null,
    motor: (formData.get('motor') as string) || null,
    chasis: (formData.get('chasis') as string) || null,
    clienteId: clienteId ? Number(clienteId) : null,
  }).returning({ id: schema.vehiculos.id });
  revalidatePath(`/${slug}/dashboard/vehiculos`);
  redirect(`/${slug}/dashboard/vehiculos/${row.id}`);
}

export async function updateVehiculo(id: number, formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  await db.update(schema.vehiculos).set({
    dominio: String(formData.get('dominio') || '').trim().toUpperCase(),
    marca: (formData.get('marca') as string) || null,
    modelo: (formData.get('modelo') as string) || null,
    tipo: (formData.get('tipo') as string) || null,
    color: (formData.get('color') as string) || null,
    anio: formData.get('anio') ? Number(formData.get('anio')) : null,
    kilometraje: formData.get('kilometraje') ? Number(formData.get('kilometraje')) : null,
    combustible: (formData.get('combustible') as string) || null,
    motor: (formData.get('motor') as string) || null,
    chasis: (formData.get('chasis') as string) || null,
    clienteId: formData.get('cliente_id') ? Number(formData.get('cliente_id')) : null,
  }).where(and(eq(schema.vehiculos.id, id), eq(schema.vehiculos.tenantId, u.tenantId)));
  revalidatePath(`/${slug}/dashboard/vehiculos/${id}`);
  redirect(`/${slug}/dashboard/vehiculos/${id}`);
}
