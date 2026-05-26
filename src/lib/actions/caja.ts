'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, gte, lte, and, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx, getSlug } from './_ctx';

export async function listMovimientos(dateFrom?: Date, dateTo?: Date) {
  const u = await ctx();
  const conds = [eq(schema.cajaMovimientos.tenantId, u.tenantId)];
  if (dateFrom) conds.push(gte(schema.cajaMovimientos.createdAt, dateFrom));
  if (dateTo) conds.push(lte(schema.cajaMovimientos.createdAt, dateTo));
  return await db.select().from(schema.cajaMovimientos)
    .where(and(...conds))
    .orderBy(desc(schema.cajaMovimientos.createdAt))
    .limit(200);
}

export async function getEstadoCaja() {
  const u = await ctx();
  const [resIngresos] = await db.select({ total: sum(schema.cajaMovimientos.total) })
    .from(schema.cajaMovimientos)
    .where(eq(schema.cajaMovimientos.tenantId, u.tenantId));
  return { saldo: Number(resIngresos.total) || 0 };
}

export async function createMovimiento(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const efectivo = Number(formData.get('efectivo') || 0);
  const otroMonto = Number(formData.get('otro_monto') || 0);
  const total = efectivo + otroMonto;
  const tipo = total >= 0 ? 'ingreso' : 'egreso';

  await db.insert(schema.cajaMovimientos).values({
    tenantId: u.tenantId,
    tipo: tipo as 'ingreso'|'egreso',
    detalle: String(formData.get('detalle') || '').trim(),
    efectivo: String(efectivo),
    otroMedio: (formData.get('otro_medio') as string) || null,
    otroMonto: String(otroMonto),
    total: String(total),
    createdBy: u.id,
  });
  revalidatePath(`/${slug}/dashboard/caja`);
}
