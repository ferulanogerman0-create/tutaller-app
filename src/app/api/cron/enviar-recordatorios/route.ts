import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq, lte, gte } from 'drizzle-orm';
import { getTelefonoNormalizado } from '@/lib/whatsapp';
import { getConfig } from '@/lib/actions/config';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy); limite.setDate(limite.getDate() + 3);
  limite.setHours(23, 59, 59, 999);

  const tenants = await db.select({ id: schema.tenants.id, evoInstanceName: schema.tenants.evoInstanceName }).from(schema.tenants);
  let totalSent = 0, totalSkipped = 0, totalFailed = 0;
  const detalles: { tenantId: number; id: number; status: string }[] = [];

  for (const tenant of tenants) {
    const pendientes = await db.query.recordatorios.findMany({
      where: and(
        eq(schema.recordatorios.tenantId, tenant.id),
        eq(schema.recordatorios.estado, 'pendiente'),
        gte(schema.recordatorios.fechaProgramada, hoy),
        lte(schema.recordatorios.fechaProgramada, limite),
      ),
      with: { cliente: true, vehiculo: true },
    });

    if (!pendientes.length) continue;

    const tpl = await getConfig('wa_msg_recordatorio', tenant.id);
    const evoUrl = process.env.EVOLUTION_API_URL || '';
    const evoKey = process.env.EVOLUTION_API_KEY || '';
    const evoInst = tenant.evoInstanceName || '';

    for (const r of pendientes) {
      const tel = getTelefonoNormalizado(r.cliente?.telefono || r.cliente?.telefonoAlt);
      if (!tel) {
        totalSkipped++;
        detalles.push({ tenantId: tenant.id, id: r.id, status: 'sin tel' });
        continue;
      }

      const vehiculo = r.vehiculo
        ? `${r.vehiculo.marca || ''} ${r.vehiculo.modelo || ''} (${r.vehiculo.dominio || ''})`.trim()
        : '';
      const nombre = r.cliente?.nombre?.split(' ')[0] || '';
      const msg = tpl
        .replace(/\{nombre\}/g, nombre)
        .replace(/\{vehiculo\}/g, vehiculo)
        .replace(/\{servicio\}/g, r.titulo);

      try {
        if (!evoUrl || !evoKey || !evoInst) {
          totalSkipped++;
          detalles.push({ tenantId: tenant.id, id: r.id, status: 'no evo config' });
          continue;
        }
        const resp = await fetch(`${evoUrl.replace(/\/$/, '')}/message/sendText/${evoInst}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: evoKey },
          body: JSON.stringify({ number: tel, text: msg }),
        });
        if (resp.ok) {
          await db.update(schema.recordatorios)
            .set({ estado: 'enviado', enviadoAt: new Date() })
            .where(eq(schema.recordatorios.id, r.id));
          totalSent++;
          detalles.push({ tenantId: tenant.id, id: r.id, status: 'enviado' });
        } else {
          totalFailed++;
          detalles.push({ tenantId: tenant.id, id: r.id, status: `error ${resp.status}` });
        }
      } catch (e) {
        totalFailed++;
        detalles.push({ tenantId: tenant.id, id: r.id, status: String(e).slice(0, 60) });
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, skipped: totalSkipped, failed: totalFailed, detalles });
}
