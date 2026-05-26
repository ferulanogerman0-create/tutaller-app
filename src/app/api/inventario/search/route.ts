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
  const tipo = searchParams.get('tipo'); // servicio | repuesto | null
  if (q.length < 1) return NextResponse.json({ results: [] });

  const conds = [
    eq(schema.inventarioItems.tenantId, me.tenantId),
    eq(schema.inventarioItems.activo, true),
    or(
      ilike(schema.inventarioItems.nombre, `%${q}%`),
      ilike(schema.inventarioItems.codigo, `%${q}%`),
    ),
  ];
  if (tipo) conds.push(eq(schema.inventarioItems.tipo, tipo as 'servicio' | 'repuesto'));

  const rows = await db.select({
    id: schema.inventarioItems.id,
    codigo: schema.inventarioItems.codigo,
    nombre: schema.inventarioItems.nombre,
    tipo: schema.inventarioItems.tipo,
    precio: schema.inventarioItems.precio,
    ivaPct: schema.inventarioItems.ivaPct,
  })
    .from(schema.inventarioItems)
    .where(and(...conds))
    .limit(15);

  return NextResponse.json({ results: rows });
}
