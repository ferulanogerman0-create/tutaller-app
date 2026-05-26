import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const N8N_WEBHOOK = process.env.N8N_FINANZAS_WEBHOOK || 'https://n8n.wolfdma.website/webhook/fma-finanzas-export';

type FinanzaRow = {
  notion_id: string;
  descripcion: string;
  tipo: string;
  categoria: string;
  monto: number;
  vehiculo: string;
  cliente: string;
  proveedor: string;
  origen: string;
  usuario: string;
  fecha: string | null;
  timestamp: string | null;
};

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const r = await fetch(N8N_WEBHOOK, { method: 'GET' });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `n8n webhook ${r.status}: ${t}` }, { status: 500 });
    }
    const data = await r.json() as { results: FinanzaRow[]; count: number };
    const rows = data.results || [];

    let inserted = 0, updated = 0, skipped = 0;
    for (const f of rows) {
      const tipoRaw = (f.tipo || '').toLowerCase();
      if (!tipoRaw) { skipped++; continue; }
      const tipo: 'ingreso' | 'egreso' = tipoRaw === 'ingreso' ? 'ingreso' : 'egreso';
      const monto = Number(f.monto || 0);
      if (!monto) { skipped++; continue; }
      const total = tipo === 'ingreso' ? monto : -monto;
      const fechaDate = f.fecha ? new Date(f.fecha + 'T12:00:00') : f.timestamp ? new Date(f.timestamp) : null;

      const existing = await db.select({ id: schema.cajaMovimientos.id })
        .from(schema.cajaMovimientos)
        .where(and(eq(schema.cajaMovimientos.notionId, f.notion_id), eq(schema.cajaMovimientos.tenantId, me.tenantId)))
        .limit(1);

      const values = {
        tenantId: me.tenantId,
        tipo,
        detalle: f.descripcion || f.categoria || 'Notion finanzas',
        efectivo: tipo === 'ingreso' ? String(monto) : String(-monto),
        otroMedio: null,
        otroMonto: '0',
        total: String(total),
        categoria: f.categoria || null,
        origen: `notion_${(f.origen || 'import').slice(0, 24)}`,
        vehiculo: f.vehiculo || null,
        proveedor: f.proveedor || null,
        clienteRef: f.cliente || null,
        fechaMovimiento: fechaDate,
        notionId: f.notion_id,
      };

      if (existing[0]) {
        await db.update(schema.cajaMovimientos).set(values).where(eq(schema.cajaMovimientos.id, existing[0].id));
        updated++;
      } else {
        await db.insert(schema.cajaMovimientos).values({
          ...values,
          createdAt: fechaDate || new Date(),
        });
        inserted++;
      }
    }

    const origin = req.headers.get('x-forwarded-host')
      ? `https://${req.headers.get('x-forwarded-host')}`
      : new URL(req.url).origin;
    return NextResponse.redirect(`${origin}/dashboard/admin/import?notion=${inserted}&updated=${updated}&skipped=${skipped}`, 303);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 });
}
