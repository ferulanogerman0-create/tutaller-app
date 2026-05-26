import Link from 'next/link';
import { db, schema } from '@/lib/db';
import { listRecordatorios, createRecordatorio, marcarRecordatorioCompletado, cancelarRecordatorio } from '@/lib/actions/recordatorios';
import { Check, X } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<string, string> = {
  service: 'Service', cambio_aceite: 'Cambio aceite', revision: 'Revisión',
  vtv: 'VTV', seguro: 'Seguro', otro: 'Otro',
};
const ESTADO_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-500/30 text-yellow-300',
  enviado: 'bg-blue-500/30 text-blue-300',
  completado: 'bg-green-500/30 text-green-300',
  cancelado: 'bg-fma-gray-light/40 text-fma-white-soft/60',
};

export default async function RecordatoriosPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ estado?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { estado } = await searchParams;
  const me = await getSessionUser();
  const tid = me!.tenantId;
  const recordatorios = await listRecordatorios({ estado });
  const clientes = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(eq(schema.clientes.tenantId, tid))
    .orderBy(schema.clientes.nombre).limit(2000);
  const vehiculos = await db.select({ id: schema.vehiculos.id, dominio: schema.vehiculos.dominio, modelo: schema.vehiculos.modelo })
    .from(schema.vehiculos)
    .where(eq(schema.vehiculos.tenantId, tid))
    .orderBy(schema.vehiculos.dominio).limit(2000);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Recordatorios</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-bold text-fma-white mb-4">Nuevo recordatorio</h2>
        <form action={createRecordatorio} className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Tipo *</label>
            <select name="tipo" defaultValue="service" required className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1 text-fma-white-soft/80">Título *</label>
            <input name="titulo" required className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" placeholder="Cambio aceite cada 10.000 km" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Cliente</label>
            <select name="clienteId" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
              <option value="">—</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Vehículo</label>
            <select name="vehiculoId" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
              <option value="">—</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.dominio} — {v.modelo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Fecha programada *</label>
            <input name="fechaProgramada" type="datetime-local" required className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm mb-1 text-fma-white-soft/80">Detalle</label>
            <textarea name="detalle" rows={2} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
          </div>
          <div className="col-span-3">
            <button type="submit" className="btn-primary">Crear recordatorio</button>
          </div>
        </form>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {['todos','pendiente','enviado','completado','cancelado'].map((e) => (
          <Link key={e} href={e === 'todos' ? `${base}/recordatorios` : `${base}/recordatorios?estado=${e}`}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase ${(estado || 'todos') === e ? 'bg-fma-cyan text-fma-black' : 'bg-fma-black-3 text-fma-white-soft/80 hover:bg-fma-gray'}`}>
            {e}
          </Link>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_180px_180px_140px_120px] gap-0 px-4 py-3 text-xs uppercase tracking-wide text-fma-white-soft/50 border-b border-fma-gray bg-fma-black-3">
          <div>Tipo</div><div>Título</div><div>Cliente</div><div>Vehículo</div><div>Fecha</div><div>Acción</div>
        </div>
        {recordatorios.length === 0 && <div className="py-10 text-center text-fma-white-soft/40">Sin recordatorios</div>}
        {recordatorios.map((r) => (
          <div key={r.id} className="grid grid-cols-[140px_1fr_180px_180px_140px_120px] gap-0 px-4 py-3 items-center border-b border-fma-gray hover:bg-fma-black-3">
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ESTADO_COLOR[r.estado]}`}>{r.estado}</span>
              <div className="text-xs text-fma-white-soft/50 mt-1">{TIPO_LABEL[r.tipo]}</div>
            </div>
            <div className="text-fma-white text-sm pr-2">{r.titulo}</div>
            <div className="text-fma-white-soft/80 text-sm truncate">{r.cliente?.nombre || '—'}</div>
            <div className="text-fma-white-soft/80 text-sm">{r.vehiculo?.dominio || '—'}</div>
            <div className="text-fma-white-soft/80 text-sm">{new Date(r.fechaProgramada).toLocaleDateString('es-AR')}</div>
            <div className="flex gap-1">
              {r.estado === 'pendiente' && (
                <>
                  <form action={marcarRecordatorioCompletado.bind(null, r.id)}>
                    <button title="Completar" className="p-1.5 bg-green-600/30 text-green-300 hover:bg-green-600/50 rounded"><Check className="h-3.5 w-3.5" /></button>
                  </form>
                  <form action={cancelarRecordatorio.bind(null, r.id)}>
                    <button title="Cancelar" className="p-1.5 bg-red-600/30 text-red-300 hover:bg-red-600/50 rounded"><X className="h-3.5 w-3.5" /></button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
