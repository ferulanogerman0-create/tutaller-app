import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const cid = Number(id);
  if (!cid) return NextResponse.json({ results: [] });
  const rows = await db.select({
    id: schema.vehiculos.id,
    dominio: schema.vehiculos.dominio,
    marca: schema.vehiculos.marca,
    modelo: schema.vehiculos.modelo,
    anio: schema.vehiculos.anio,
  }).from(schema.vehiculos).where(and(eq(schema.vehiculos.tenantId, me.tenantId), eq(schema.vehiculos.clienteId, cid)));
  return NextResponse.json({ results: rows });
}
