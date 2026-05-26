import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { sincronizarMovimientoCajaOrden } from '@/lib/actions/ordenes';

export const runtime = 'nodejs';
export const maxDuration = 300;

const CUTOFF = new Date('2026-05-05T00:00:00.000Z');

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // 1) Borrar movimientos caja origen='orden' de este tenant
  const deleted = await db.delete(schema.cajaMovimientos)
    .where(and(eq(schema.cajaMovimientos.tenantId, me.tenantId), eq(schema.cajaMovimientos.origen, 'orden')))
    .returning({ id: schema.cajaMovimientos.id });

  // 2) Set fechaEgreso = fechaIngreso para órdenes entregadas históricas de este tenant
  await db.execute(sql`
    UPDATE ordenes
    SET fecha_egreso = fecha_ingreso, updated_at = fecha_ingreso
    WHERE tenant_id = ${me.tenantId}
      AND estado = 'entregado'
      AND fecha_ingreso < ${CUTOFF.toISOString()}
  `);

  // 3) Re-sincronizar movimientos caja para entregadas con pago de este tenant
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
  return NextResponse.redirect(`${origin}/dashboard/caja?fixed=${inserted}&deleted=${deleted.length}`, 303);
}
