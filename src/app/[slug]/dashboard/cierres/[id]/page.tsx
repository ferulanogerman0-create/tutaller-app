import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCierre } from '@/lib/actions/cierres';

export const dynamic = 'force-dynamic';

export default async function CierreDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const c = await getCierre(Number(id));
  if (!c) notFound();
  const esperado = Number(c.saldoInicial) + Number(c.totalIngresos) - Number(c.totalEgresos);
  const diferencia = Number(c.saldoFinal) - esperado;

  return (
    <div className="p-6 max-w-[1200px]">
      <Link href={`${base}/cierres`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-2">Cierre #{c.id}</h1>
      <p className="text-fma-white-soft/60 mb-6">
        Apertura: {new Date(c.fechaApertura).toLocaleString('es-AR')}
        {c.fechaCierre && ` · Cierre: ${new Date(c.fechaCierre).toLocaleString('es-AR')}`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <S label="Saldo inicial" v={`$${Number(c.saldoInicial).toLocaleString('es-AR')}`} />
        <S label="Ingresos" v={`$${Number(c.totalIngresos).toLocaleString('es-AR')}`} color="text-green-400" />
        <S label="Egresos" v={`$${Number(c.totalEgresos).toLocaleString('es-AR')}`} color="text-red-400" />
        <S label="Saldo esperado" v={`$${esperado.toLocaleString('es-AR')}`} color="text-fma-cyan" />
        <S label="Saldo contado" v={`$${Number(c.saldoFinal).toLocaleString('es-AR')}`} color={Math.abs(diferencia) < 0.5 ? 'text-green-400' : 'text-yellow-300'} />
      </div>

      {Math.abs(diferencia) >= 0.5 && (
        <div className={`card mb-6 ${diferencia > 0 ? 'border-yellow-500/40' : 'border-red-500/40'} border-2`}>
          <div className="text-sm font-semibold">
            Diferencia: <span className={diferencia > 0 ? 'text-yellow-300' : 'text-red-400'}>
              {diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-fma-white-soft/60 ml-2">({diferencia > 0 ? 'sobrante' : 'faltante'})</span>
          </div>
        </div>
      )}

      {c.notas && (
        <div className="card mb-6">
          <div className="text-xs uppercase text-fma-white-soft/50 mb-1">Notas</div>
          <div className="text-fma-white text-sm whitespace-pre-wrap">{c.notas}</div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Movimientos del turno ({c.movimientos.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-left px-4 py-2">Detalle</th>
              <th className="text-right px-4 py-2">Efectivo</th>
              <th className="text-right px-4 py-2">Otro</th>
              <th className="text-right px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {c.movimientos.map((m) => (
              <tr key={m.id} className="border-t border-fma-gray">
                <td className="px-4 py-1.5 text-xs text-fma-white-soft/80">{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                <td className="px-4 py-1.5 text-fma-white">{m.detalle}</td>
                <td className="px-4 py-1.5 text-right">${Number(m.efectivo).toLocaleString('es-AR')}</td>
                <td className="px-4 py-1.5 text-right">{m.otroMedio ? `$${Number(m.otroMonto).toLocaleString('es-AR')}` : '—'}</td>
                <td className={`px-4 py-1.5 text-right font-bold ${Number(m.total) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Number(m.total).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function S({ label, v, color = 'text-fma-white' }: { label: string; v: string; color?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase text-fma-white-soft/50 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{v}</div>
    </div>
  );
}
