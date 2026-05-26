import Link from 'next/link';
import { Plus, MoreVertical } from 'lucide-react';
import { listOrdenes } from '@/lib/actions/ordenes';
import { VehiculoBadge } from '@/components/vehiculo-badge';

export const dynamic = 'force-dynamic';

const ESTADO_LABEL: Record<string, { txt: string; cls: string }> = {
  ingresado: { txt: 'INGRESADO', cls: 'bg-fma-gray-light/40 text-fma-white border border-fma-gray-light' },
  diagnostico: { txt: 'DIAGNÓSTICO', cls: 'bg-purple-600 text-white' },
  en_reparacion: { txt: 'EN REPARACION', cls: 'bg-red-600 text-white' },
  reparado: { txt: 'REPARADO', cls: 'bg-green-600 text-white' },
  entregado: { txt: 'ENTREGADO', cls: 'bg-fma-cyan text-fma-black' },
};

const PAGO_COLOR: Record<string, string> = {
  pendiente: 'text-red-400',
  parcial: 'text-orange-400',
  pagado: 'text-green-400',
};

export default async function OrdenesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ estado?: string }> }) {
  const { slug } = await params;
  const { estado } = await searchParams;
  const base = `/${slug}/dashboard`;
  const ordenes = await listOrdenes({ estado });

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Órdenes</h1>
        <Link href={`${base}/ordenes/nueva`} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva orden
        </Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos','ingresado','diagnostico','en_reparacion','reparado','entregado'].map((e) => (
          <Link
            key={e}
            href={e === 'todos' ? `${base}/ordenes` : `${base}/ordenes?estado=${e}`}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
              (estado || 'todos') === e
                ? 'bg-fma-cyan text-fma-black'
                : 'bg-fma-black-3 text-fma-white-soft/80 hover:bg-fma-gray'
            }`}
          >
            {e === 'todos' ? 'Todos' : ESTADO_LABEL[e]?.txt}
          </Link>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 mb-4">
        {ordenes.length === 0 && <div className="card text-center py-8 text-fma-white-soft/40">Sin órdenes</div>}
        {ordenes.map(({ orden, cliente, vehiculo }) => {
          const e = ESTADO_LABEL[orden.estado];
          const fecha = new Date(orden.fechaIngreso);
          return (
            <Link key={`m-${orden.id}`} href={`${base}/ordenes/${orden.id}`}
              className="card block hover:bg-fma-black-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${e?.cls}`}>{e?.txt}</span>
                <span className="font-mono text-xs text-fma-cyan">{orden.comprobante}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <VehiculoBadge marca={vehiculo?.marca || null} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-fma-white text-sm">{vehiculo?.dominio || '—'}</div>
                  <div className="text-xs text-fma-white-soft/60 truncate">{vehiculo?.marca || ''} {vehiculo?.modelo || ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">${Number(orden.totalBruto).toLocaleString('es-AR')}</div>
                  <div className={`text-xs ${PAGO_COLOR[orden.pagoEstado]}`}>{orden.pagoEstado}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-fma-white-soft/60">
                <span className="truncate">{cliente?.nombre || '—'}</span>
                <span>{fecha.toLocaleDateString('es-AR')}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <div className="min-w-[1080px]">
        <div className="grid grid-cols-[140px_220px_220px_180px_160px_160px_140px_40px] gap-0 text-xs uppercase tracking-wide text-fma-white-soft/50 px-4 py-3 border-b border-fma-gray bg-fma-black-3">
          <div>Estado</div>
          <div>Vehículo</div>
          <div>Cliente</div>
          <div>Orden</div>
          <div>Fecha</div>
          <div>Pago</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>
        {ordenes.length === 0 && (
          <div className="text-center py-12 text-fma-white-soft/40">Sin órdenes</div>
        )}
        {ordenes.map(({ orden, cliente, vehiculo }) => {
          const e = ESTADO_LABEL[orden.estado];
          const fecha = new Date(orden.fechaIngreso);
          const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          return (
            <Link
              key={orden.id}
              href={`${base}/ordenes/${orden.id}`}
              className="grid grid-cols-[140px_220px_220px_180px_160px_160px_140px_40px] gap-0 items-center px-4 py-3 border-b border-fma-gray hover:bg-fma-black-3 transition-colors"
            >
              <div>
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${e?.cls}`}>
                  {e?.txt}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VehiculoBadge marca={vehiculo?.marca || null} />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-fma-white text-sm">{vehiculo?.dominio || '—'}</div>
                  <div className="text-xs text-fma-white-soft/60 truncate">{vehiculo?.marca || ''} {vehiculo?.modelo || ''}</div>
                </div>
              </div>
              <div className="text-fma-white-soft truncate pr-2">{cliente?.nombre || '—'}</div>
              <div className="font-mono text-fma-cyan text-sm">{orden.comprobante}</div>
              <div className="text-fma-white-soft/80 text-sm">
                <div>{fechaStr}</div>
                <div className="text-xs text-fma-white-soft/50">{horaStr}hs</div>
              </div>
              <div className={`text-sm ${PAGO_COLOR[orden.pagoEstado]}`}>
                <div className="font-semibold">{orden.pagoEstado === 'pagado' ? 'Realizado' : orden.pagoEstado === 'parcial' ? 'Parcial' : 'Pendiente'}</div>
                <div className="text-xs text-fma-white-soft/50">Caja {orden.pagoEstado === 'pagado' ? 'Cerrada' : 'Abierta'}</div>
              </div>
              <div className="text-right text-green-400 font-bold">${Number(orden.totalBruto).toLocaleString('es-AR')}</div>
              <div className="text-fma-cyan flex justify-end">
                <MoreVertical className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}
