import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { sincronizarMovimientoCajaOrden } from '@/lib/actions/ordenes';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'hoy'; // hoy | semana | todos

  let desde: Date;
  if (scope === 'todos') desde = new Date(0);
  else if (scope === 'semana') { desde = new Date(); desde.setDate(desde.getDate() - 7); desde.setHours(0, 0, 0, 0); }
  else { desde = new Date(); desde.setHours(0, 0, 0, 0); }

  // Órdenes entregadas con pago > 0 en rango
  const ordenes = await db.select({ id: schema.ordenes.id })
    .from(schema.ordenes)
    .where(and(
      eq(schema.ordenes.tenantId, me.tenantId),
      eq(schema.ordenes.estado, 'entregado'),
      gte(schema.ordenes.fechaEgreso, desde),
      sql`(CAST(${schema.ordenes.pagoEfectivo} AS NUMERIC) + CAST(${schema.ordenes.pagoOtroMonto} AS NUMERIC)) > 0`,
    ));

  // Si no hay fechaEgreso, también incluir entregadas creadas en rango
  const ordenesPorFecha = await db.select({ id: schema.ordenes.id })
    .from(schema.ordenes)
    .where(and(
      eq(schema.ordenes.tenantId, me.tenantId),
      eq(schema.ordenes.estado, 'entregado'),
      gte(schema.ordenes.updatedAt, desde),
      sql`${schema.ordenes.fechaEgreso} IS NULL`,
      sql`(CAST(${schema.ordenes.pagoEfectivo} AS NUMERIC) + CAST(${schema.ordenes.pagoOtroMonto} AS NUMERIC)) > 0`,
    ));

  const ids = Array.from(new Set([...ordenes, ...ordenesPorFecha].map(o => o.id)));
  let inserted = 0, updated = 0, skipped = 0;
  for (const id of ids) {
    const r = await sincronizarMovimientoCajaOrden(id, me.tenantId, me.id);
    if (!r) skipped++;
    else if (r.action === 'inserted') inserted++;
    else updated++;
  }

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/dashboard/caja?sync=${inserted}+${updated}`, 303);
}
