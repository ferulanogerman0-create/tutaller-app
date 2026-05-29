import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { and, gte, lte, sql, desc } from 'drizzle-orm';
import { resumenPeriodo, ingresoMedioPago } from '@/lib/actions/stats';
import { getSlug } from '@/lib/actions/_ctx';
import { Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InformesPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const slug = await getSlug();
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);
  if (me.role !== 'admin' && me.role !== 'owner' && me.role !== 'contable') redirect(`/${slug}/dashboard`);

  const sp = await searchParams;
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const desde = sp.desde ? new Date(sp.desde) : inicioMes;
  const hasta = sp.hasta ? new Date(sp.hasta) : hoy;
  hasta.setHours(23, 59, 59, 999);

  const [resumen, pagos] = await Promise.all([
    resumenPeriodo(desde, hasta),
    ingresoMedioPago(desde, hasta),
  ]);

  const ordenes = await db.select({
    id: schema.ordenes.id,
    comprobante: schema.ordenes.comprobante,
    fechaIngreso: schema.ordenes.fechaIngreso,
    estado: schema.ordenes.estado,
    totalBruto: schema.ordenes.totalBruto,
    pagoEstado: schema.ordenes.pagoEstado,
    clienteNombre: schema.clientes.nombre,
    vehDominio: schema.vehiculos.dominio,
  }).from(schema.ordenes)
    .leftJoin(schema.clientes, sql`${schema.clientes.id} = ${schema.ordenes.clienteId}`)
    .leftJoin(schema.vehiculos, sql`${schema.vehiculos.id} = ${schema.ordenes.vehiculoId}`)
    .where(and(
      gte(schema.ordenes.fechaIngreso, desde),
      lte(schema.ordenes.fechaIngreso, hasta),
    ))
    .orderBy(desc(schema.ordenes.fechaIngreso))
    .limit(500);

  const exportUrl = `/api/informes/csv?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`;

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Informes</h1>
        <a href={exportUrl} className="btn-primary inline-flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" /> Exportar CSV
        </a>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatBig label="Órdenes" value={(resumen.total_ordenes || 0).toString()} />
        <StatBig label="Facturado" value={`$${Number(resumen.facturado || 0).toLocaleString('es-AR')}`} color="text-green-400" />
        <StatBig label="Cobrado" value={`$${Number(resumen.cobrado || 0).toLocaleString('es-AR')}`} color="text-fma-cyan" />
        <StatBig label="Por cobrar" value={`$${Number((resumen.facturado || 0) - (resumen.cobrado || 0)).toLocaleString('es-AR')}`} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatBig label="Neto" value={`$${Number(resumen.neto || 0).toLocaleString('es-AR')}`} small />
        <StatBig label="IVA" value={`$${Number(resumen.iva || 0).toLocaleString('es-AR')}`} small />
        <StatBig label="Mano de obra" value={`$${Number(resumen.mano_obra || 0).toLocaleString('es-AR')}`} small />
        <StatBig label="Repuestos" value={`$${Number(resumen.repuestos || 0).toLocaleString('es-AR')}`} small />
        <StatBig label="Efectivo" value={`$${Number(pagos.efectivo || 0).toLocaleString('es-AR')}`} small />
        <StatBig label="Otros medios" value={`$${Number(pagos.otros || 0).toLocaleString('es-AR')}`} small />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Órdenes del período ({ordenes.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-xs uppercase text-fma-white-soft/50 bg-fma-black-3">
              <tr>
                <th className="text-left py-2 px-3">Comprobante</th>
                <th className="text-left py-2 px-3">Fecha</th>
                <th className="text-left py-2 px-3">Cliente</th>
                <th className="text-left py-2 px-3">Vehículo</th>
                <th className="text-left py-2 px-3">Estado</th>
                <th className="text-left py-2 px-3">Pago</th>
                <th className="text-right py-2 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                  <td className="py-1.5 px-3 font-mono text-fma-cyan">{o.comprobante}</td>
                  <td className="py-1.5 px-3 text-fma-white-soft/80">{new Date(o.fechaIngreso).toLocaleDateString('es-AR')}</td>
                  <td className="py-1.5 px-3 text-fma-white truncate max-w-[180px]">{o.clienteNombre || '—'}</td>
                  <td className="py-1.5 px-3 font-mono text-xs text-fma-white-soft/80">{o.vehDominio || '—'}</td>
                  <td className="py-1.5 px-3 capitalize text-fma-white-soft">{o.estado.replace('_', ' ')}</td>
                  <td className="py-1.5 px-3 capitalize text-fma-white-soft">{o.pagoEstado}</td>
                  <td className="py-1.5 px-3 text-right text-green-400 font-bold">${Number(o.totalBruto).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatBig({ label, value, color = 'text-fma-white', small = false }: { label: string; value: string; color?: string; small?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-fma-white-soft/50 mb-1">{label}</div>
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-bold ${color}`}>{value}</div>
    </div>
  );
}
