import Link from 'next/link';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { listPresupuestos, aprobarPresupuesto, eliminarPresupuesto } from '@/lib/actions/presupuestos';

export const dynamic = 'force-dynamic';

export default async function PresupuestosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const rows = await listPresupuestos();

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Presupuestos</h1>
        <Link href={`${base}/presupuestos/nuevo`} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo presupuesto
        </Link>
      </div>
      <p className="text-fma-white-soft/60 mb-6">Cuando el cliente aprueba, presupuesto → orden con todos los ítems.</p>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-fma-black-3 text-fma-white-soft/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Comprobante</th>
              <th className="text-left px-4 py-3">Vehículo</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-fma-white-soft/40">Sin presupuestos</td></tr>
            )}
            {rows.map(({ orden, cliente, vehiculo }) => {
              const aprobar = aprobarPresupuesto.bind(null, orden.id);
              const eliminar = eliminarPresupuesto.bind(null, orden.id);
              return (
                <tr key={orden.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                  <td className="px-4 py-3">
                    <Link href={`${base}/ordenes/${orden.id}`} className="text-fma-cyan hover:underline font-mono">
                      {orden.comprobante}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fma-white-soft/80">
                    {vehiculo ? <><span className="font-mono">{vehiculo.dominio}</span> · {vehiculo.marca} {vehiculo.modelo}</> : '—'}
                  </td>
                  <td className="px-4 py-3 text-fma-white-soft/80">{cliente?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-fma-white-soft/60 text-xs">{orden.fechaIngreso.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right text-fma-white-soft/80">${Number(orden.totalBruto).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 flex gap-1 justify-end">
                    <form action={aprobar}>
                      <button type="submit" className="text-green-400 hover:bg-green-500/10 p-1.5 rounded" title="Aprobar (convierte a orden)">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </form>
                    <form action={eliminar}>
                      <button type="submit" className="text-red-400 hover:bg-red-500/10 p-1.5 rounded" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
