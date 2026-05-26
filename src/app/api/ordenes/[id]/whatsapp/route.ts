import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generarPdfOrden } from '@/lib/pdf/orden-pdf';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { enviarWhatsApp, getTelefonoNormalizado } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const oid = Number(id);
  if (!oid) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const orden = await db.query.ordenes.findFirst({
    where: and(eq(schema.ordenes.id, oid), eq(schema.ordenes.tenantId, user.tenantId)),
    with: { cliente: true, vehiculo: true },
  });
  if (!orden) return NextResponse.json({ error: 'orden not found' }, { status: 404 });

  const phonePrimary = getTelefonoNormalizado(orden.cliente?.telefono);
  const phoneAlt = getTelefonoNormalizado(orden.cliente?.telefonoAlt);
  if (!phonePrimary && !phoneAlt) return NextResponse.json({ error: 'Cliente sin teléfono cargado. Editá los datos del cliente.' }, { status: 400 });

  let body: { mensaje?: string } = {};
  try { body = await req.json(); } catch {}
  const mensaje = body.mensaje?.trim() || await defaultMensaje(orden, user.tenantId);

  const buf = await generarPdfOrden(oid, user.tenantId);
  const pdfBase64 = buf.toString('base64');

  const candidates = [phonePrimary, phoneAlt].filter((x): x is string => !!x);
  let lastError = '';
  for (const phone of candidates) {
    const result = await enviarWhatsApp({
      phone, caption: mensaje, pdfBase64,
      fileName: `orden-${orden.comprobante}.pdf`,
      meta: { ordenId: oid, comprobante: orden.comprobante, clienteId: orden.clienteId },
    });
    if (result.ok) return NextResponse.json({ ok: true, via: result.via, phoneUsed: phone });
    lastError = result.error || 'desconocido';
  }
  return NextResponse.json({ error: lastError, triedPhones: candidates }, { status: 400 });
}

async function defaultMensaje(orden: { comprobante: string; totalBruto: string; totalNeto: string; vehiculo?: { dominio: string | null; marca: string | null; modelo: string | null } | null; cliente?: { nombre: string } | null }, tenantId: number): Promise<string> {
  const { getConfig } = await import('@/lib/actions/config');
  const tpl = await getConfig('wa_msg_orden', tenantId);
  const veh = orden.vehiculo ? `${orden.vehiculo.marca || ''} ${orden.vehiculo.modelo || ''} (${orden.vehiculo.dominio || ''})` : '';
  const total = Number(orden.totalBruto).toLocaleString('es-AR');
  const neto = Number(orden.totalNeto).toLocaleString('es-AR');
  const nombre = orden.cliente?.nombre?.split(' ')[0] || '';
  return tpl
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{comprobante\}/g, orden.comprobante)
    .replace(/\{vehiculo\}/g, veh)
    .replace(/\{total\}/g, total)
    .replace(/\{neto\}/g, neto)
    .trim();
}
