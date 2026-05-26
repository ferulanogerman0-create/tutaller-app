import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Asocia cada vehículo al cliente que más veces lo tuvo en órdenes (scoped a este tenant)
  const result = await db.execute(sql`
    UPDATE vehiculos v
    SET cliente_id = sub.cliente_id
    FROM (
      SELECT DISTINCT ON (vehiculo_id)
        vehiculo_id,
        cliente_id,
        COUNT(*) OVER (PARTITION BY vehiculo_id, cliente_id) as cnt
      FROM ordenes
      WHERE tenant_id = ${me.tenantId}
        AND vehiculo_id IS NOT NULL AND cliente_id IS NOT NULL
      ORDER BY vehiculo_id, cnt DESC, cliente_id
    ) sub
    WHERE v.id = sub.vehiculo_id
      AND v.tenant_id = ${me.tenantId}
      AND v.cliente_id IS NULL
  `);

  const [{ c: total }] = await db.execute(sql`SELECT COUNT(*)::INT AS c FROM vehiculos WHERE tenant_id = ${me.tenantId} AND cliente_id IS NOT NULL`) as unknown as { c: number }[];
  const [{ c: pendientes }] = await db.execute(sql`SELECT COUNT(*)::INT AS c FROM vehiculos WHERE tenant_id = ${me.tenantId} AND cliente_id IS NULL`) as unknown as { c: number }[];

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : new URL(req.url).origin;
  return NextResponse.redirect(`${base}/dashboard/admin/import?vehasoc=${total}&vehsin=${pendientes}`, 303);
}
