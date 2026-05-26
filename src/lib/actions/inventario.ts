'use server';
import { db, schema } from '@/lib/db';
import { eq, ilike, or, desc, sql, isNotNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { notificar } from '@/lib/notificar';

export async function listItems(query?: string) {
  const u = await ctx();
  if (query) {
    return await db.select().from(schema.inventarioItems)
      .where(and(
        eq(schema.inventarioItems.tenantId, u.tenantId),
        or(ilike(schema.inventarioItems.nombre, `%${query}%`), ilike(schema.inventarioItems.codigo, `%${query}%`)),
      ))
      .orderBy(desc(schema.inventarioItems.createdAt)).limit(500);
  }
  return await db.select().from(schema.inventarioItems)
    .where(eq(schema.inventarioItems.tenantId, u.tenantId))
    .orderBy(desc(schema.inventarioItems.createdAt)).limit(500);
}

export async function listStockBajo() {
  const u = await ctx();
  return db.select().from(schema.inventarioItems)
    .where(and(
      eq(schema.inventarioItems.tenantId, u.tenantId),
      eq(schema.inventarioItems.activo, true),
      eq(schema.inventarioItems.tipo, 'repuesto'),
      isNotNull(schema.inventarioItems.stock),
      sql`${schema.inventarioItems.stock} <= ${schema.inventarioItems.stockMinimo}`,
    ))
    .orderBy(schema.inventarioItems.stock);
}

export async function createInventarioItem(formData: FormData) {
  const u = await ctx();
  await db.insert(schema.inventarioItems).values({
    tenantId: u.tenantId,
    codigo: (formData.get('codigo') as string) || null,
    nombre: String(formData.get('nombre') || '').trim(),
    tipo: (formData.get('tipo') as 'servicio'|'repuesto') || 'servicio',
    precio: String(formData.get('precio') || 0),
    categoria: (formData.get('categoria') as string) || null,
    stock: formData.get('stock') ? Number(formData.get('stock')) : null,
    stockMinimo: formData.get('stock_minimo') ? Number(formData.get('stock_minimo')) : 0,
    activo: true,
  });
  revalidatePath('/dashboard/inventario');
}

export async function updateInventarioItem(id: number, formData: FormData) {
  const u = await ctx();
  await db.update(schema.inventarioItems).set({
    codigo: (formData.get('codigo') as string) || null,
    nombre: String(formData.get('nombre') || '').trim(),
    tipo: (formData.get('tipo') as 'servicio'|'repuesto') || 'servicio',
    precio: String(formData.get('precio') || 0),
    categoria: (formData.get('categoria') as string) || null,
    stock: formData.get('stock') !== '' ? Number(formData.get('stock')) : null,
    stockMinimo: Number(formData.get('stock_minimo') || 0),
  }).where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, u.tenantId)));
  revalidatePath('/dashboard/inventario');
}

export async function ajustarStock(id: number, delta: number) {
  const u = await ctx();
  await db.update(schema.inventarioItems)
    .set({ stock: sql`COALESCE(${schema.inventarioItems.stock}, 0) + ${delta}` })
    .where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, u.tenantId)));

  if (delta < 0) {
    const [item] = await db.select().from(schema.inventarioItems)
      .where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, u.tenantId)))
      .limit(1);
    if (item && item.stock !== null && item.stockMinimo !== null && item.stock <= item.stockMinimo) {
      await notificar('stock_bajo',
        `⚠️ *Stock bajo*: ${item.nombre}\nStock actual: ${item.stock} (mín: ${item.stockMinimo})`,
        u.tenantId,
      );
    }
  }

  revalidatePath('/dashboard/inventario');
}

export async function deleteInventarioItem(id: number) {
  const u = await ctx();
  await db.update(schema.inventarioItems).set({ activo: false })
    .where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, u.tenantId)));
  revalidatePath('/dashboard/inventario');
}
