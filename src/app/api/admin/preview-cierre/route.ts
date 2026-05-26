import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getConfig } from '@/lib/actions/config';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

type Periodo = 'diario' | 'semanal' | 'mensual';

async function calcularCierre(desde: Date, hasta: Date, tenantId: number) {
  const [r] = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE tipo='ingreso')::INT AS movs_in,
      COUNT(*) FILTER (WHERE tipo='egreso')::INT AS movs_out,
      COALESCE(SUM(CASE WHEN tipo='ingreso' THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS ingresos,
      COALESCE(SUM(CASE WHEN tipo='egreso' THEN ABS(CAST(total AS NUMERIC)) ELSE 0 END), 0)::FLOAT AS egresos,
      COALESCE(SUM(CAST(efectivo AS NUMERIC)), 0)::FLOAT AS efectivo,
      COALESCE(SUM(CAST(otro_monto AS NUMERIC)), 0)::FLOAT AS otros
    FROM caja_movimientos
    WHERE tenant_id = ${tenantId}
      AND COALESCE(fecha_movimiento, created_at) BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
  `) as unknown as { movs_in: number; movs_out: number; ingresos: number; egresos: number; efectivo: number; otros: number }[];
  const ordenes = await db.execute(sql`
    SELECT COUNT(*)::INT AS total, COALESCE(SUM(CAST(total_bruto AS NUMERIC)), 0)::FLOAT AS facturado
    FROM ordenes
    WHERE tenant_id = ${tenantId}
      AND fecha_ingreso BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
      AND es_presupuesto = false
  `) as unknown as { total: number; facturado: number }[];
  const cats = await db.execute(sql`
    SELECT categoria, COUNT(*)::INT AS cnt, COALESCE(SUM(ABS(CAST(total AS NUMERIC))), 0)::FLOAT AS total
    FROM caja_movimientos
    WHERE tenant_id = ${tenantId}
      AND COALESCE(fecha_movimiento, created_at) BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
      AND tipo='egreso' AND categoria IS NOT NULL
    GROUP BY categoria ORDER BY total DESC LIMIT 5
  `) as unknown as { categoria: string; cnt: number; total: number }[];
  return { ...r, ordenes: ordenes[0], topGastos: cats };
}

function fmt(n: number) { return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 }); }

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const periodo = (new URL(req.url).searchParams.get('periodo') || 'diario') as Periodo;
  const ahora = new Date();
  let desde: Date, hasta: Date;
  if (periodo === 'diario') {
    desde = new Date(ahora); desde.setHours(0,0,0,0);
    hasta = new Date(ahora); hasta.setHours(23,59,59,999);
  } else if (periodo === 'semanal') {
    desde = new Date(ahora); desde.setDate(desde.getDate()-7); desde.setHours(0,0,0,0);
    hasta = new Date(ahora);
  } else {
    const corte = Number(await getConfig('cierre_dia_corte', me.tenantId)) || 5;
    hasta = new Date(ahora.getFullYear(), ahora.getMonth(), corte, 23,59,59,999);
    if (hasta > ahora) hasta.setMonth(hasta.getMonth()-1);
    desde = new Date(hasta); desde.setMonth(desde.getMonth()-1); desde.setDate(corte); desde.setHours(0,0,0,0);
  }
  const data = await calcularCierre(desde, hasta, me.tenantId);
  const titulo = periodo === 'diario' ? '📅 Cierre Diario' : periodo === 'semanal' ? '📊 Cierre Semanal' : '📈 Cierre Mensual';
  const rango = `${desde.toLocaleDateString('es-AR')} → ${hasta.toLocaleDateString('es-AR')}`;
  const neto = (data.ingresos || 0) - (data.egresos || 0);
  let txt = `${titulo}\n${rango}\n\n`;
  txt += `🔧 Órdenes: ${data.ordenes?.total || 0}\n`;
  txt += `💵 Facturado: $${fmt(data.ordenes?.facturado || 0)}\n\n`;
  txt += `📥 Ingresos: $${fmt(data.ingresos || 0)} (${data.movs_in} movs)\n`;
  txt += `📤 Egresos: $${fmt(data.egresos || 0)} (${data.movs_out} movs)\n`;
  txt += `💰 Neto: $${fmt(neto)}\n\n`;
  txt += `💵 Efectivo: $${fmt(data.efectivo || 0)}\n`;
  txt += `💳 Otros medios: $${fmt(data.otros || 0)}\n`;
  if (data.topGastos.length > 0) {
    txt += `\n🛒 Top gastos:\n`;
    for (const c of data.topGastos) txt += `  · ${c.categoria}: $${fmt(c.total)}\n`;
  }
  return NextResponse.json({ ok: true, periodo, desde, hasta, data, text: txt });
}
