'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx, getSlug } from './_ctx';

function nextPresupuestoCode(id: number) {
  return `PRES-${String(id).padStart(8, '0')}`;
}
function nextOrdenCode(id: number) {
  return `0001-${String(id).padStart(8, '0')}`;
}

export async function listPresupuestos() {
  const u = await ctx();
  return await db.select({
    orden: schema.ordenes,
    cliente: schema.clientes,
    vehiculo: schema.vehiculos,
  })
    .from(schema.ordenes)
    .leftJoin(schema.clientes, eq(schema.ordenes.clienteId, schema.clientes.id))
    .leftJoin(schema.vehiculos, eq(schema.ordenes.vehiculoId, schema.vehiculos.id))
    .where(and(eq(schema.ordenes.tenantId, u.tenantId), eq(schema.ordenes.esPresupuesto, true)))
    .orderBy(desc(schema.ordenes.fechaIngreso))
    .limit(100);
}

export async function createPresupuesto(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const clienteId = Number(formData.get('cliente_id')) || null;
  const vehiculoId = Number(formData.get('vehiculo_id')) || null;

  const [row] = await db.insert(schema.ordenes).values({
    tenantId: u.tenantId,
    comprobante: 'tmp',
    clienteId, vehiculoId,
    tecnicoId: formData.get('tecnico_id') ? Number(formData.get('tecnico_id')) : null,
    concepto: (formData.get('concepto') as 'REPARACION'|'SERVICE'|'MANTENIMIENTO'|'REVISION'|'GARANTIA'|'OTRO') || 'REPARACION',
    combustible: (formData.get('combustible') as 'Bajo'|'Cuarto'|'Medio'|'Alto'|'Lleno') || null,
    kilometraje: formData.get('kilometraje') ? Number(formData.get('kilometraje')) : null,
    categoria: (formData.get('categoria') as string) || null,
    observaciones: (formData.get('observaciones') as string) || null,
    comentarioInterno: (formData.get('comentario_interno') as string) || null,
    esPresupuesto: true,
    createdBy: u.id,
  }).returning({ id: schema.ordenes.id });

  await db.update(schema.ordenes)
    .set({ comprobante: nextPresupuestoCode(row.id) })
    .where(and(eq(schema.ordenes.id, row.id), eq(schema.ordenes.tenantId, u.tenantId)));

  revalidatePath(`/${slug}/dashboard/presupuestos`);
  redirect(`/${slug}/dashboard/ordenes/${row.id}`);
}

export async function aprobarPresupuesto(id: number) {
  const u = await ctx();
  const slug = await getSlug();
  const [updated] = await db.update(schema.ordenes)
    .set({
      esPresupuesto: false,
      presupuestoAprobadoAt: new Date(),
      comprobante: nextOrdenCode(id),
      fechaIngreso: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId), eq(schema.ordenes.esPresupuesto, true)))
    .returning({ id: schema.ordenes.id });

  if (!updated) throw new Error('No es presupuesto o ya fue aprobado');

  revalidatePath(`/${slug}/dashboard/presupuestos`);
  revalidatePath(`/${slug}/dashboard/ordenes`);
  redirect(`/${slug}/dashboard/ordenes/${id}`);
}

export async function eliminarPresupuesto(id: number) {
  const u = await ctx();
  const slug = await getSlug();
  await db.delete(schema.ordenes)
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId), eq(schema.ordenes.esPresupuesto, true)));
  revalidatePath(`/${slug}/dashboard/presupuestos`);
  redirect(`/${slug}/dashboard/presupuestos`);
}
