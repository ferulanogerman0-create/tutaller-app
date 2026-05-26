import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { sincronizarMovimientoCajaOrden } from '@/lib/actions/ordenes';
import mapping from '@/lib/data/cierres-mapping.json';

export const runtime = 'nodejs';
export const maxDuration = 600;

type Row = { comp: string; caja: string; estado: string; fechaEmision: string; fechaCierre: string };

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = mapping as Row[];

  // 1) Borrar movs caja origen=orden de este tenant
  const deleted = await db.delete(schema.cajaMovimientos)
    .where(and(eq(schema.cajaMovimientos.tenantId, me.tenantId), eq(schema.cajaMovimientos.origen, 'orden')))
    .returning({ id: schema.cajaMovimientos.id });

  // 2) UPDATE fechaEgreso por mapping comprobante → cierre fecha (scoped a este tenant)
  let updated = 0;
  for (const r of rows) {
    const fecha = new Date(r.fechaCierre + 'T12:00:00');
    const res = await db.update(schema.ordenes)
      .set({ fechaEgreso: fecha, updatedAt: fecha })
      .where(and(eq(schema.ordenes.tenantId, me.tenantId), eq(schema.ordenes.comprobante, r.comp)))
      .returning({ id: schema.ordenes.id });
    if (res.length) updated++;
  }

  // 3) Re-sync movs caja para entregadas+pagadas de este tenant
  const ordenes = await db.select({ id: schema.ordenes.id })
    .from(schema.ordenes)
    .where(and(
      eq(schema.ordenes.tenantId, me.tenantId),
      eq(schema.ordenes.estado, 'entregado'),
      sql`(CAST(${schema.ordenes.pagoEfectivo} AS NUMERIC) + CAST(${schema.ordenes.pagoOtroMonto} AS NUMERIC)) > 0`,
    ));

  let inserted = 0;
  for (const o of ordenes) {
    const r = await sincronizarMovimientoCajaOrden(o.id, me.tenantId, me.id);
    if (r?.action === 'inserted') inserted++;
  }

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/dashboard/caja?cierres=${updated}&movs=${inserted}&deleted=${deleted.length}`, 303);
}
