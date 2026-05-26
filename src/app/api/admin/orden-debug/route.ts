import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id') || 0);
  if (!id) return NextResponse.json({ error: 'id required' });
  const o = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, me.tenantId), eq(schema.ordenes.id, id))).limit(1);
  const items = await db.select().from(schema.ordenItems).where(and(eq(schema.ordenItems.tenantId, me.tenantId), eq(schema.ordenItems.ordenId, id)));
  return NextResponse.json({ orden: o[0], items });
}
