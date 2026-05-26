import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // 1) Reset orden_items.iva_pct = 0 for this tenant
  await db.execute(sql`UPDATE orden_items SET iva_pct = 0 WHERE tenant_id = ${me.tenantId}`);
  // 2) Reset inventario_items.iva_pct = 0 for this tenant
  await db.execute(sql`UPDATE inventario_items SET iva_pct = 0 WHERE tenant_id = ${me.tenantId}`);
  // 3) Recalc totales for this tenant's ordenes
  await db.execute(sql`
    UPDATE ordenes o SET
      total_repuestos = COALESCE(t.rep, 0),
      total_mano_obra = COALESCE(t.mo, 0),
      total_iva = 0,
      total_neto = COALESCE(t.rep, 0) + COALESCE(t.mo, 0),
      total_bruto = COALESCE(t.rep, 0) + COALESCE(t.mo, 0),
      updated_at = NOW()
    FROM (
      SELECT
        orden_id,
        SUM(CASE WHEN tipo='repuesto' THEN CAST(subtotal AS NUMERIC) ELSE 0 END)::FLOAT AS rep,
        SUM(CASE WHEN tipo='servicio' THEN CAST(subtotal AS NUMERIC) ELSE 0 END)::FLOAT AS mo
      FROM orden_items WHERE tenant_id = ${me.tenantId} GROUP BY orden_id
    ) t
    WHERE o.id = t.orden_id AND o.tenant_id = ${me.tenantId}
  `);

  const counts = await db.execute(sql`SELECT (SELECT COUNT(*) FROM orden_items) AS orden_items, (SELECT COUNT(*) FROM inventario_items) AS inv_items, (SELECT COUNT(*) FROM ordenes) AS ordenes`) as unknown as { orden_items: number; inv_items: number; ordenes: number }[];

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : new URL(req.url).origin;
  return NextResponse.redirect(`${base}/dashboard/admin/import?nuke=ok&counts=${encodeURIComponent(JSON.stringify(counts[0]||{}))}`, 303);
}
