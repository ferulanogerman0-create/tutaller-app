import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const pct = Number(url.searchParams.get('pct') || '5');
  const tipo = url.searchParams.get('tipo') || 'servicio'; // servicio | repuesto | todos
  const factor = 1 + pct / 100;

  let res;
  if (tipo === 'todos') {
    res = await db.execute(sql`
      UPDATE inventario_items
      SET precio = ROUND(CAST(precio AS NUMERIC) * ${factor}, 2)
      WHERE activo = true AND tenant_id = ${me.tenantId}
    `);
  } else {
    res = await db.execute(sql`
      UPDATE inventario_items
      SET precio = ROUND(CAST(precio AS NUMERIC) * ${factor}, 2)
      WHERE activo = true AND tipo = ${tipo} AND tenant_id = ${me.tenantId}
    `);
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : new URL(req.url).origin;
  return NextResponse.redirect(`${base}/dashboard/inventario?bumped=${pct}&tipo=${tipo}`, 303);
}
