import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ordenId = Number(body.ordenId);
  const iva = body.iva == null ? 0 : Number(body.iva);
  if (!ordenId) return NextResponse.json({ error: 'ordenId required' }, { status: 400 });
  if (!Number.isFinite(iva) || iva < 0 || iva > 100) return NextResponse.json({ error: 'iva invalid' }, { status: 400 });

  // Set iva_pct for ALL items of this orden (scoped to tenant)
  await db.update(schema.ordenItems).set({ ivaPct: String(iva) })
    .where(and(eq(schema.ordenItems.tenantId, me.tenantId), eq(schema.ordenItems.ordenId, ordenId)));

  // Recalcular totales orden
  const items = await db.select().from(schema.ordenItems)
    .where(and(eq(schema.ordenItems.tenantId, me.tenantId), eq(schema.ordenItems.ordenId, ordenId)));
  let totalRepuestos = 0, totalManoObra = 0, totalIva = 0;
  for (const it of items) {
    const sub = Number(it.subtotal);
    const itemIva = sub * (Number(it.ivaPct) / 100);
    if (it.tipo === 'repuesto') totalRepuestos += sub; else totalManoObra += sub;
    totalIva += itemIva;
  }
  const totalNeto = totalRepuestos + totalManoObra;
  const totalBruto = totalNeto + totalIva;
  await db.update(schema.ordenes).set({
    totalRepuestos: String(totalRepuestos),
    totalManoObra: String(totalManoObra),
    totalIva: String(totalIva),
    totalNeto: String(totalNeto),
    totalBruto: String(totalBruto),
    updatedAt: new Date(),
  }).where(and(eq(schema.ordenes.tenantId, me.tenantId), eq(schema.ordenes.id, ordenId)));

  revalidatePath(`/dashboard/ordenes/${ordenId}`);
  return NextResponse.json({ ok: true, items: items.length, iva, totalBruto });
}
