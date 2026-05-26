import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Cat = { categoria: string | null; total: number; movs: number };

async function getResumenFinanzas(desde: Date, hasta: Date, tenantId: number) {
  const [tot] = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN tipo='ingreso' THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS ingresos,
      COALESCE(SUM(CASE WHEN tipo='egreso' THEN ABS(CAST(total AS NUMERIC)) ELSE 0 END), 0)::FLOAT AS egresos,
      COUNT(*)::INT AS movs
    FROM caja_movimientos
    WHERE tenant_id = ${tenantId}
      AND COALESCE(fecha_movimiento, created_at) BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
  `) as unknown as { ingresos: number; egresos: number; movs: number }[];

  const ingresos = await db.execute(sql`
    SELECT categoria, COUNT(*)::INT AS movs, COALESCE(SUM(CAST(total AS NUMERIC)), 0)::FLOAT AS total
    FROM caja_movimientos
    WHERE tenant_id = ${tenantId} AND tipo='ingreso'
      AND COALESCE(fecha_movimiento, created_at) BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
    GROUP BY categoria ORDER BY total DESC
  `) as unknown as Cat[];

  const egresos = await db.execute(sql`
    SELECT categoria, COUNT(*)::INT AS movs, COALESCE(SUM(ABS(CAST(total AS NUMERIC))), 0)::FLOAT AS total
    FROM caja_movimientos
    WHERE tenant_id = ${tenantId} AND tipo='egreso'
      AND COALESCE(fecha_movimiento, created_at) BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
    GROUP BY categoria ORDER BY total DESC
  `) as unknown as Cat[];

  return { tot, ingresos, egresos };
}

export default async function FinanzasPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ desde?: string; hasta?: string; preset?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);
  if (me.role !== 'admin' && me.role !== 'contable') redirect(base);

  const sp = await searchParams;
  const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
  let desde: Date;
  let hasta = hoy;

  if (sp.preset === 'semana') {
    desde = new Date();
    const d = (desde.getDay() + 6) % 7;
    desde.setDate(desde.getDate() - d);
    desde.setHours(0, 0, 0, 0);
  } else if (sp.preset === 'anio') {
    desde = new Date(hoy.getFullYear(), 0, 1);
  } else if (sp.desde) {
    desde = new Date(sp.desde);
    if (sp.hasta) hasta = new Date(sp.hasta);
  } else {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  const { tot, ingresos, egresos } = await getResumenFinanzas(desde, hasta, me.tenantId);
  const neto = Number(tot.ingresos) - Number(tot.egresos);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Finanzas</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <PresetLink base={base} current={sp.preset} value="semana" label="Esta semana" />
        <PresetLink base={base} current={sp.preset || 'mes'} value="mes" label="Este mes" />
        <PresetLink base={base} current={sp.preset} value="anio" label="Este año" />
      </div>

      <form className="card mb-4 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-fma-white-soft/60 mb-1">Desde</label>
          <input type="date" name="desde" defaultValue={desde.toISOString().slice(0, 10)}
            className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        </div>
        <div>
          <label className="block text-xs text-fma-white-soft/60 mb-1">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta.toISOString().slice(0, 10)}
            className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        </div>
        <button type="submit" className="btn-primary text-sm">Aplicar</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Ingresos" value={`$${Number(tot.ingresos).toLocaleString('es-AR')}`} color="text-green-400" icon={TrendingUp} />
        <KPI label="Egresos" value={`$${Number(tot.egresos).toLocaleString('es-AR')}`} color="text-red-400" icon={TrendingDown} />
        <KPI label="Neto" value={`$${neto.toLocaleString('es-AR')}`} color={neto >= 0 ? 'text-fma-cyan' : 'text-red-400'} icon={DollarSign} />
        <KPI label="Movimientos" value={tot.movs.toString()} color="text-fma-white" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryTable title="Ingresos por categoría" rows={ingresos} color="text-green-400" total={Number(tot.ingresos)} />
        <CategoryTable title="Gastos por categoría" rows={egresos} color="text-red-400" total={Number(tot.egresos)} />
      </div>
    </div>
  );
}

function PresetLink({ base, current, value, label }: { base: string; current: string | undefined; value: string; label: string }) {
  const active = current === value || (value === 'mes' && !current);
  return (
    <a href={`${base}/finanzas?preset=${value}`}
      className={`px-3 py-1.5 rounded text-xs font-semibold ${active ? 'bg-fma-cyan text-fma-black' : 'bg-fma-black-3 text-fma-white-soft hover:bg-fma-gray'}`}>
      {label}
    </a>
  );
}

function KPI({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div className="text-xs uppercase text-fma-white-soft/50">{label}</div>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function CategoryTable({ title, rows, color, total }: { title: string; rows: Cat[]; color: string; total: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">{title}</div>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-fma-white-soft/50">
          <tr>
            <th className="text-left px-4 py-2">Categoría</th>
            <th className="text-right px-4 py-2">Movs</th>
            <th className="text-right px-4 py-2">Total</th>
            <th className="text-right px-4 py-2">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-fma-white-soft/40">Sin datos</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-fma-gray">
              <td className="px-4 py-2 text-fma-white">{r.categoria || <span className="text-fma-white-soft/40">Sin categoría</span>}</td>
              <td className="px-4 py-2 text-right text-fma-white-soft">{r.movs}</td>
              <td className={`px-4 py-2 text-right font-bold ${color}`}>${Number(r.total).toLocaleString('es-AR')}</td>
              <td className="px-4 py-2 text-right text-fma-white-soft/60 text-xs">
                {total > 0 ? `${((Number(r.total) / total) * 100).toFixed(1)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
