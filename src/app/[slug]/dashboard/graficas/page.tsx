import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { facturacionMensual, ordenesPorEstado, topClientes, topMarcas } from '@/lib/actions/stats';
import { FacturacionChart, EstadoPieChart, MarcasChart } from './charts';

export const dynamic = 'force-dynamic';

export default async function GraficasPage() {
  const me = await getSessionUser();
  if (!me) redirect('/login');
  if (me.role !== 'admin' && me.role !== 'contable') redirect('/dashboard');

  const [factMes, porEstado, clientes, marcas] = await Promise.all([
    facturacionMensual(12),
    ordenesPorEstado(),
    topClientes(10),
    topMarcas(10),
  ]);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Gráficas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold text-fma-white mb-3">Facturación mensual (12 meses)</h2>
          <FacturacionChart data={factMes} />
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-fma-white mb-3">Órdenes por estado</h2>
          <EstadoPieChart data={porEstado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-bold text-fma-white mb-3">Top 10 marcas</h2>
          <MarcasChart data={marcas} />
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-fma-white mb-3">Top 10 clientes</h2>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-fma-white-soft/50">
              <tr>
                <th className="text-left py-1">Cliente</th>
                <th className="text-right py-1">Órdenes</th>
                <th className="text-right py-1">Facturado</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-fma-gray">
                  <td className="py-1.5 text-fma-white truncate max-w-[200px]">{c.nombre}</td>
                  <td className="py-1.5 text-right text-fma-white-soft">{c.ordenes}</td>
                  <td className="py-1.5 text-right text-green-400 font-bold">${Number(c.facturado || 0).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
