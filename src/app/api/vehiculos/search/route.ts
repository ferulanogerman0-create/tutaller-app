import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { ilike, or, and, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const rows = await db.select({
    id: schema.vehiculos.id,
    dominio: schema.vehiculos.dominio,
    marca: schema.vehiculos.marca,
    modelo: schema.vehiculos.modelo,
    clienteId: schema.vehiculos.clienteId,
  }).from(schema.vehiculos).where(and(
    eq(schema.vehiculos.tenantId, me.tenantId),
    or(
      ilike(schema.vehiculos.dominio, `%${q}%`),
      ilike(schema.vehiculos.marca, `%${q}%`),
      ilike(schema.vehiculos.modelo, `%${q}%`),
    ),
  )).limit(20);
  return NextResponse.json({ results: rows });
}
