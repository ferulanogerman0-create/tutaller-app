'use server';
import { db, schema } from '@/lib/db';
import { eq, ilike, or, desc, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx, getSlug } from './_ctx';

export async function listProveedores(q?: string) {
  const u = await ctx();
  if (q) {
    return db.select().from(schema.proveedores)
      .where(and(
        eq(schema.proveedores.tenantId, u.tenantId),
        eq(schema.proveedores.activo, true),
        or(
          ilike(schema.proveedores.nombre, `%${q}%`),
          ilike(schema.proveedores.cuit, `%${q}%`),
          ilike(schema.proveedores.rubro, `%${q}%`),
        ),
      ))
      .orderBy(schema.proveedores.nombre);
  }
  return db.select().from(schema.proveedores)
    .where(and(eq(schema.proveedores.tenantId, u.tenantId), eq(schema.proveedores.activo, true)))
    .orderBy(schema.proveedores.nombre);
}

export async function getProveedor(id: number) {
  const u = await ctx();
  const rows = await db.select().from(schema.proveedores)
    .where(and(eq(schema.proveedores.id, id), eq(schema.proveedores.tenantId, u.tenantId)))
    .limit(1);
  if (!rows[0]) return null;
  const movs = await db.select().from(schema.cajaMovimientos)
    .where(and(eq(schema.cajaMovimientos.proveedor, rows[0].nombre), eq(schema.cajaMovimientos.tenantId, u.tenantId)))
    .orderBy(desc(schema.cajaMovimientos.createdAt))
    .limit(100);
  return { ...rows[0], movimientos: movs };
}

export async function createProveedor(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const nombre = String(formData.get('nombre') || '').trim();
  if (!nombre) throw new Error('nombre requerido');
  await db.insert(schema.proveedores).values({
    tenantId: u.tenantId,
    nombre,
    cuit: (formData.get('cuit') as string) || null,
    telefono: (formData.get('telefono') as string) || null,
    email: (formData.get('email') as string) || null,
    direccion: (formData.get('direccion') as string) || null,
    rubro: (formData.get('rubro') as string) || null,
    comentario: (formData.get('comentario') as string) || null,
  });
  revalidatePath(`/${slug}/dashboard/proveedores`);
}

export async function updateProveedor(id: number, formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  await db.update(schema.proveedores).set({
    nombre: String(formData.get('nombre') || '').trim(),
    cuit: (formData.get('cuit') as string) || null,
    telefono: (formData.get('telefono') as string) || null,
    email: (formData.get('email') as string) || null,
    direccion: (formData.get('direccion') as string) || null,
    rubro: (formData.get('rubro') as string) || null,
    comentario: (formData.get('comentario') as string) || null,
  }).where(and(eq(schema.proveedores.id, id), eq(schema.proveedores.tenantId, u.tenantId)));
  revalidatePath(`/${slug}/dashboard/proveedores/${id}`);
  revalidatePath(`/${slug}/dashboard/proveedores`);
}

export async function registrarCompra(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const proveedorId = Number(formData.get('proveedor_id'));
  const monto = Number(formData.get('monto') || 0);
  const detalle = String(formData.get('detalle') || '').trim();
  const categoria = (formData.get('categoria') as string) || 'Repuestos';
  const medio = (formData.get('medio') as string) || 'efectivo';

  if (!proveedorId || !monto || monto <= 0) throw new Error('faltan datos');

  const prov = await db.select({ nombre: schema.proveedores.nombre })
    .from(schema.proveedores)
    .where(and(eq(schema.proveedores.id, proveedorId), eq(schema.proveedores.tenantId, u.tenantId)))
    .limit(1);
  if (!prov[0]) throw new Error('proveedor no encontrado');

  await db.insert(schema.cajaMovimientos).values({
    tenantId: u.tenantId,
    tipo: 'egreso',
    detalle: `${detalle || 'Compra'} — ${prov[0].nombre}`,
    efectivo: medio === 'efectivo' ? String(-monto) : '0',
    otroMedio: medio === 'efectivo' ? null : medio,
    otroMonto: medio === 'efectivo' ? '0' : String(-monto),
    total: String(-monto),
    categoria,
    origen: 'compra',
    proveedor: prov[0].nombre,
    createdBy: u.id,
  });

  await db.update(schema.proveedores)
    .set({ saldo: sql`CAST(${schema.proveedores.saldo} AS NUMERIC) + ${monto}` })
    .where(and(eq(schema.proveedores.id, proveedorId), eq(schema.proveedores.tenantId, u.tenantId)));

  revalidatePath(`/${slug}/dashboard/proveedores/${proveedorId}`);
  revalidatePath(`/${slug}/dashboard/caja`);
}

export async function eliminarProveedor(id: number) {
  const u = await ctx();
  const slug = await getSlug();
  await db.update(schema.proveedores).set({ activo: false })
    .where(and(eq(schema.proveedores.id, id), eq(schema.proveedores.tenantId, u.tenantId)));
  revalidatePath(`/${slug}/dashboard/proveedores`);
  redirect(`/${slug}/dashboard/proveedores`);
}
