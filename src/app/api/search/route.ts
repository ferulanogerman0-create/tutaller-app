import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { ilike, or, and, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  const slug = req.headers.get('x-tenant-slug') || '';
  if (q.length < 2) return NextResponse.json({ results: [] });
  const like = `%${q}%`;
  const tid = me.tenantId;
  const base = slug ? `/${slug}/dashboard` : '/dashboard';

  const [clientes, vehiculos, ordenes] = await Promise.all([
    db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre, dni: schema.clientes.dni, telefono: schema.clientes.telefono })
      .from(schema.clientes).where(and(
        eq(schema.clientes.tenantId, tid),
        or(ilike(schema.clientes.nombre, like), ilike(schema.clientes.dni, like), ilike(schema.clientes.telefono, like)),
      )).limit(8),
    db.select({ id: schema.vehiculos.id, dominio: schema.vehiculos.dominio, marca: schema.vehiculos.marca, modelo: schema.vehiculos.modelo })
      .from(schema.vehiculos).where(and(
        eq(schema.vehiculos.tenantId, tid),
        or(ilike(schema.vehiculos.dominio, like), ilike(schema.vehiculos.marca, like), ilike(schema.vehiculos.modelo, like)),
      )).limit(8),
    db.select({ id: schema.ordenes.id, comprobante: schema.ordenes.comprobante, totalBruto: schema.ordenes.totalBruto })
      .from(schema.ordenes).where(and(
        eq(schema.ordenes.tenantId, tid),
        ilike(schema.ordenes.comprobante, like),
      )).limit(8),
  ]);

  return NextResponse.json({
    results: [
      ...clientes.map(c => ({ type: 'cliente', id: c.id, label: c.nombre, sub: `${c.dni || ''} · ${c.telefono || ''}`, href: `${base}/clientes/${c.id}` })),
      ...vehiculos.map(v => ({ type: 'vehiculo', id: v.id, label: v.dominio, sub: `${v.marca || ''} ${v.modelo || ''}`, href: `${base}/vehiculos/${v.id}` })),
      ...ordenes.map(o => ({ type: 'orden', id: o.id, label: o.comprobante, sub: `$${Number(o.totalBruto).toLocaleString('es-AR')}`, href: `${base}/ordenes/${o.id}` })),
    ],
  });
}
