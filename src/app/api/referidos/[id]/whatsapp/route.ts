import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { getTelefonoNormalizado } from '@/lib/whatsapp';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const cid = Number(id);
  if (!cid) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const [row] = await db.select({
    codigo: schema.referidosCodigos,
    cliente: schema.clientes,
  })
    .from(schema.referidosCodigos)
    .innerJoin(schema.clientes, eq(schema.referidosCodigos.clienteId, schema.clientes.id))
    .where(and(eq(schema.referidosCodigos.id, cid), eq(schema.referidosCodigos.tenantId, me.tenantId)))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const phone = getTelefonoNormalizado(row.cliente.telefono || row.cliente.telefonoAlt);
  if (!phone) return NextResponse.json({ error: 'cliente sin teléfono' }, { status: 400 });

  let body: { mensaje?: string } = {};
  try { body = await req.json(); } catch {}
  const mensaje = body.mensaje?.trim();
  if (!mensaje) return NextResponse.json({ error: 'mensaje vacío' }, { status: 400 });

  // Envío texto via Evolution — SIEMPRE instancia propia del tenant (multi-tenant, nunca global)
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const [tenant] = await db.select({ evo: schema.tenants.evoInstanceName }).from(schema.tenants).where(eq(schema.tenants.id, me.tenantId)).limit(1);
  const evoInst = tenant?.evo || '';
  if (!evoUrl || !evoKey || !evoInst) {
    return NextResponse.json({ error: 'Tu taller no tiene WhatsApp conectado (plan Bot). Configuralo en Ajustes.' }, { status: 400 });
  }

  const resp = await fetch(`${evoUrl.replace(/\/$/, '')}/message/sendText/${evoInst}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evoKey },
    body: JSON.stringify({ number: phone, text: mensaje }),
  });

  if (!resp.ok) {
    const errTxt = await resp.text().catch(() => '');
    return NextResponse.json({ error: `Evolution ${resp.status}: ${errTxt}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
