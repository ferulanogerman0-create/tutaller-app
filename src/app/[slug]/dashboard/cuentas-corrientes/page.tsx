import Link from 'next/link';
import { listClientesConSaldo, getResumenCtaCte } from '@/lib/actions/cuentas-corrientes';
import { ArrowRight, TrendingDown, TrendingUp, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CuentasCorrientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const [rows, resumen] = await Promise.all([listClientesConSaldo(), getResumenCtaCte()]);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Cuentas Corrientes</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI icon={Users} label="Deudores" value={resumen.deudores.toString()} color="text-orange-400" />
        <KPI icon={Users} label="Con saldo a favor" value={resumen.a_favor.toString()} color="text-green-400" />
        <KPI icon={TrendingUp} label="Total deuda" value={`$${Number(resumen.total_deuda).toLocaleString('es-AR')}`} color="text-orange-400" />
        <KPI icon={TrendingDown} label="Total a favor" value={`$${Math.abs(Number(resumen.total_a_favor)).toLocaleString('es-AR')}`} color="text-green-400" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Clientes con saldo ({rows.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Teléfono</th>
                <th className="text-right px-4 py-2">Saldo</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-fma-white-soft/40">Sin saldos pendientes</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                  <td className="px-4 py-2 text-fma-white">{r.nombre}</td>
                  <td className="px-4 py-2 text-fma-white-soft/80">{r.telefono || '—'}</td>
                  <td className={`px-4 py-2 text-right font-bold ${Number(r.saldo) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    ${Number(r.saldo).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`${base}/cuentas-corrientes/${r.id}`} className="text-fma-cyan hover:text-fma-white">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
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
