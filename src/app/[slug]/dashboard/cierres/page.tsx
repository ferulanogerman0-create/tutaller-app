import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { listCierres } from '@/lib/actions/cierres';
import { ArrowRight, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CierresPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);
  if (me.role !== 'admin' && me.role !== 'owner' && me.role !== 'contable' && me.role !== 'recepcion') redirect(base);

  const cierres = await listCierres(100);

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Cierres de caja</h1>
        <Link href={`${base}/caja`} className="btn-secondary text-sm">Volver a caja</Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Apertura</th>
                <th className="text-left px-4 py-3">Cierre</th>
                <th className="text-right px-4 py-3">S. inicial</th>
                <th className="text-right px-4 py-3">Ingresos</th>
                <th className="text-right px-4 py-3">Egresos</th>
                <th className="text-right px-4 py-3">S. final</th>
                <th className="text-right px-4 py-3">Diferencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cierres.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-fma-white-soft/40">Sin cierres</td></tr>}
              {cierres.map((c) => {
                const esperado = Number(c.saldoInicial) + Number(c.totalIngresos) - Number(c.totalEgresos);
                const diferencia = Number(c.saldoFinal) - esperado;
                return (
                  <tr key={c.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                    <td className="px-4 py-2 font-mono text-fma-cyan">#{c.id}</td>
                    <td className="px-4 py-2 text-fma-white-soft/80 text-xs">{new Date(c.fechaApertura).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 text-fma-white-soft/80 text-xs">
                      {c.fechaCierre ? new Date(c.fechaCierre).toLocaleString('es-AR') : <span className="text-yellow-400 flex items-center gap-1"><Lock className="h-3 w-3" /> Abierta</span>}
                    </td>
                    <td className="px-4 py-2 text-right">${Number(c.saldoInicial).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 text-right text-green-400">${Number(c.totalIngresos).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 text-right text-red-400">${Number(c.totalEgresos).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 text-right font-bold text-fma-cyan">${Number(c.saldoFinal).toLocaleString('es-AR')}</td>
                    <td className={`px-4 py-2 text-right font-bold ${Math.abs(diferencia) < 0.5 ? 'text-green-400' : diferencia > 0 ? 'text-yellow-300' : 'text-red-400'}`}>
                      {c.fechaCierre ? `${diferencia >= 0 ? '+' : ''}$${diferencia.toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`${base}/cierres/${c.id}`} className="text-fma-cyan hover:text-fma-white">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
