import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { ilike, or, and, eq, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const rows = await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    dni: schema.clientes.dni,
    telefono: schema.clientes.telefono,
  }).from(schema.clientes).where(and(
    eq(schema.clientes.tenantId, me.tenantId),
    or(
      ilike(schema.clientes.nombre, `%${q}%`),
      ilike(schema.clientes.dni, `%${q}%`),
      ilike(schema.clientes.telefono, `%${q}%`),
    ),
  )).limit(20);
  return NextResponse.json({ results: rows });
}
