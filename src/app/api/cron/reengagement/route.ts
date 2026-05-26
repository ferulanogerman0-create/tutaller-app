import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getConfig } from '@/lib/actions/config';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tenants = await db.select({ id: schema.tenants.id }).from(schema.tenants);
  let totalCandidatos = 0, totalCreados = 0;

  for (const tenant of tenants) {
    const enabled = await getConfig('reengagement_enabled', tenant.id);
    if (enabled !== 'true') continue;

    const mesesStr = await getConfig('reengagement_meses_inactivo', tenant.id);
    const meses = Number(mesesStr) || 6;

    const rows = await db.execute(sql`
      SELECT c.id, c.nombre, c.telefono, MAX(o.fecha_ingreso) AS ultima_orden
      FROM clientes c
      LEFT JOIN ordenes o ON o.cliente_id = c.id AND o.tenant_id = ${tenant.id}
      WHERE c.tenant_id = ${tenant.id} AND c.telefono IS NOT NULL
      GROUP BY c.id, c.nombre, c.telefono
      HAVING MAX(o.fecha_ingreso) IS NOT NULL
        AND MAX(o.fecha_ingreso) < NOW() - (${meses} || ' months')::INTERVAL
        AND NOT EXISTS (
          SELECT 1 FROM recordatorios r
          WHERE r.cliente_id = c.id
            AND r.tenant_id = ${tenant.id}
            AND r.estado = 'pendiente'
            AND r.tipo = 'otro'
            AND r.titulo LIKE 'Re-contactar%'
        )
      LIMIT 50
    `) as unknown as { id: number; nombre: string; telefono: string; ultima_orden: string }[];

    totalCandidatos += rows.length;
    const fechaProgramada = new Date();
    for (const c of rows) {
      try {
        await db.insert(schema.recordatorios).values({
          tenantId: tenant.id,
          tipo: 'otro',
          titulo: `Re-contactar ${c.nombre}`,
          detalle: `Cliente sin orden desde ${new Date(c.ultima_orden).toLocaleDateString('es-AR')}. Llamar/escribir para ofrecer service.`,
          clienteId: c.id,
          fechaProgramada,
          estado: 'pendiente',
        });
        totalCreados++;
      } catch {}
    }
  }

  return NextResponse.json({ ok: true, candidatos: totalCandidatos, creados: totalCreados });
}
