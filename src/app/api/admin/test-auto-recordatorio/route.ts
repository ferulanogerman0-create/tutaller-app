import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { getConfig } from '@/lib/actions/config';

export const runtime = 'nodejs';

// Debug endpoint: corre la lógica auto-recordatorio para un ordenId dado
export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const ordenId = Number(searchParams.get('id') || 0);
  if (!ordenId) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const log: Record<string, unknown> = { ordenId };
  try {
    const autoEnabled = await getConfig('recordatorio_auto_enabled', me.tenantId);
    log.autoEnabled = autoEnabled;
    if (autoEnabled !== 'true') return NextResponse.json({ ...log, msg: 'auto-recordatorio off' });

    const o = await db.query.ordenes.findFirst({
      where: and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, me.tenantId)),
      with: { cliente: true, vehiculo: true },
    });
    if (!o) return NextResponse.json({ ...log, msg: 'orden not found' });
    log.estado = o.estado;
    log.concepto = o.concepto;
    log.vehiculoId = o.vehiculoId;
    log.clienteId = o.clienteId;

    if (o.estado !== 'entregado') return NextResponse.json({ ...log, msg: 'estado != entregado' });
    if (!['SERVICE', 'MANTENIMIENTO', 'REVISION'].includes(o.concepto || '')) {
      return NextResponse.json({ ...log, msg: 'concepto no aplica' });
    }
    if (!o.vehiculoId) return NextResponse.json({ ...log, msg: 'sin vehiculoId' });

    const existing = await db.select({ id: schema.recordatorios.id })
      .from(schema.recordatorios)
      .where(and(
        eq(schema.recordatorios.tenantId, me.tenantId),
        eq(schema.recordatorios.vehiculoId, o.vehiculoId),
        eq(schema.recordatorios.tipo, 'service'),
        eq(schema.recordatorios.estado, 'pendiente'),
      )).limit(1);
    log.existingPendiente = existing[0]?.id || null;
    if (existing[0]) return NextResponse.json({ ...log, msg: 'ya hay recordatorio pendiente para este vehículo' });

    const diasStr = await getConfig('recordatorio_auto_service_dias', me.tenantId);
    const kmStr = await getConfig('recordatorio_auto_service_km', me.tenantId);
    const dias = Number(diasStr) || 180;
    const kmAdd = Number(kmStr) || 10000;
    const fechaProgramada = new Date();
    fechaProgramada.setDate(fechaProgramada.getDate() + dias);
    const kmProg = o.kilometraje ? o.kilometraje + kmAdd : null;

    const [ins] = await db.insert(schema.recordatorios).values({
      tenantId: me.tenantId,
      tipo: 'service',
      titulo: `Service ${o.vehiculo?.marca || ''} ${o.vehiculo?.modelo || ''} (${o.vehiculo?.dominio || ''})`.trim(),
      detalle: `Próximo service programado tras orden ${o.comprobante}`,
      clienteId: o.clienteId,
      vehiculoId: o.vehiculoId,
      ordenId: o.id,
      fechaProgramada,
      kilometrajeProgramado: kmProg,
      estado: 'pendiente',
      createdBy: me.id,
    }).returning({ id: schema.recordatorios.id });

    return NextResponse.json({ ...log, msg: 'recordatorio creado', recordatorioId: ins.id, fechaProgramada, kmProg });
  } catch (e) {
    return NextResponse.json({ ...log, error: String(e), stack: (e as Error).stack?.slice(0, 800) }, { status: 500 });
  }
}
