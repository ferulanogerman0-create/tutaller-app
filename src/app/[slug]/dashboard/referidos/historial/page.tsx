import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listActividad } from '@/lib/actions/referidos';

export const dynamic = 'force-dynamic';

export default async function HistorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const items = await listActividad(100);
  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/referidos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-6">Historial Referidos</h1>
      {items.length === 0 ? (
        <div className="card text-center py-12 text-fma-white-soft/40">Sin actividad aún</div>
      ) : (
        <div className="space-y-2">
          {items.map((h) => (
            <div key={h.id} className="card flex items-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full ${h.tipo === 'completo' || h.tipo === 'premiado' ? 'bg-green-400' : 'bg-fma-cyan'}`} />
              <div className="flex-1">
                <div className="font-medium text-fma-white text-sm">{h.texto}</div>
                {h.sub && <div className="text-xs text-fma-white-soft/60">{h.sub}</div>}
              </div>
              <div className="text-xs text-fma-white-soft/40">{h.createdAt.toLocaleString('es-AR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
