import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { and, eq, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Estado = 'ingresado' | 'en_reparacion' | 'reparado' | 'entregado';
type Pago = 'pagado' | 'parcial' | 'pendiente';

// Estados + pago exactos según captura DIRUP 424.PNG
const CAPTURA: Record<string, { estado: Estado; pago: Pago }> = {
  '0001-00000953': { estado: 'reparado', pago: 'pagado' },
  '0001-00000952': { estado: 'ingresado', pago: 'pendiente' },
  '0001-00000951': { estado: 'reparado', pago: 'pendiente' },
  '0001-00000950': { estado: 'reparado', pago: 'pendiente' },
  '0001-00000946': { estado: 'en_reparacion', pago: 'pendiente' },
  '0001-00000938': { estado: 'reparado', pago: 'pagado' },
  '0001-00000937': { estado: 'reparado', pago: 'pagado' },
  '0001-00000935': { estado: 'en_reparacion', pago: 'pendiente' },
  '0001-00000933': { estado: 'en_reparacion', pago: 'pendiente' },
  '0001-00000912': { estado: 'reparado', pago: 'pendiente' },
  '0001-00000755': { estado: 'en_reparacion', pago: 'pendiente' },
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1) Fix: órdenes de este tenant con totalBruto=0 marcadas "pagado" pasan a "pendiente"
  await db.execute(sql`UPDATE ordenes SET pago_estado='pendiente' WHERE pago_estado='pagado' AND CAST(total_bruto AS NUMERIC) <= 0 AND tenant_id = ${user.tenantId}`);

  // 2) Aplicar set exacto de la captura
  let updated = 0;
  const notFound: string[] = [];
  for (const [comp, { estado, pago }] of Object.entries(CAPTURA)) {
    const res = await db.update(schema.ordenes)
      .set({ estado, pagoEstado: pago, updatedAt: new Date() })
      .where(and(eq(schema.ordenes.tenantId, user.tenantId), eq(schema.ordenes.comprobante, comp)))
      .returning({ id: schema.ordenes.id });
    if (res.length) updated++;
    else notFound.push(comp);
  }

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin;
  return NextResponse.redirect(
    `${origin}/dashboard/admin/import?fixed=${updated}&total=${Object.keys(CAPTURA).length}&missing=${notFound.join(',')}`,
    303,
  );
}
