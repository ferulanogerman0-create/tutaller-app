import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const vid = Number(id);
  if (!vid) return NextResponse.json({ cliente: null });

  const [row] = await db.select({
    cliente: schema.clientes,
  })
    .from(schema.vehiculos)
    .leftJoin(schema.clientes, and(eq(schema.clientes.id, schema.vehiculos.clienteId), eq(schema.clientes.tenantId, me.tenantId)))
    .where(and(eq(schema.vehiculos.id, vid), eq(schema.vehiculos.tenantId, me.tenantId)))
    .limit(1);

  return NextResponse.json({ cliente: row?.cliente || null });
}
