import Link from 'next/link';
import { Plus, Search, Gift, Trophy, CheckCircle2 } from 'lucide-react';
import { listCodigos, statsReferidos, registrarReferido } from '@/lib/actions/referidos';
import { db, schema } from '@/lib/db';
import { asc, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const FILTER_LABEL: Record<string, string> = {
  todos: 'Todos',
  sin: 'Sin referidos',
  progreso: 'En progreso',
  completo: '🎉 Completados',
  premiado: '✅ Premiados',
};

export default async function ReferidosPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ filter?: string; err?: string; ok?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { filter, err, ok } = await searchParams;
  const f = (filter || 'todos') as 'todos' | 'sin' | 'progreso' | 'completo' | 'premiado';
  const me = await getSessionUser();
  const codigos = await listCodigos(f);
  const stats = await statsReferidos();
  const clientesSinCodigo = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(eq(schema.clientes.tenantId, me!.tenantId))
    .orderBy(asc(schema.clientes.nombre))
    .limit(500);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-bold text-fma-white">Referidos</h1>
        <Link href={`${base}/referidos/talonario`} className="btn-secondary text-sm">🎫 Talonario</Link>
      </div>
      <p className="text-fma-white-soft/60 mb-6">3 referidos = premio. Sistema de recomendaciones del taller.</p>

      {ok && <div className="card mb-4 border-green-500/40 text-green-300 text-sm">{decodeURIComponent(ok)}</div>}
      {err && <div className="card mb-4 border-red-500/40 text-red-300 text-sm">{decodeURIComponent(err)}</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Clientes con código" value={stats.total} icon={Gift} color="fma-cyan" />
        <Stat label="Con referidos" value={stats.activos} icon={Trophy} color="orange-400" />
        <Stat label="Premios completados" value={stats.completados} icon={CheckCircle2} color="green-400" />
      </div>

      {/* Forms top: nuevo código + registrar referido */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="text-fma-cyan uppercase text-xs tracking-wide font-bold mb-3">➕ Generar código nuevo</h3>
          <form action={`${base}/referidos/api/codigo`} method="POST" className="space-y-2">
            <select name="cliente_id" required className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="">— Seleccionar cliente —</option>
              {clientesSinCodigo.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <input name="servicio_inicial" placeholder="Servicio realizado (opcional)" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
            <select name="premio_tipo" defaultValue="aceite" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="aceite">🛢️ Cambio de aceite y filtro gratis</option>
              <option value="descuento">🔧 40% descuento próxima reparación</option>
              <option value="eleccion">🎁 A elección del cliente</option>
            </select>
            <button type="submit" className="btn-primary w-full">Generar código REF-XXXX</button>
          </form>
        </div>

        <div className="card">
          <h3 className="text-fma-cyan uppercase text-xs tracking-wide font-bold mb-3">📋 Registrar referido</h3>
          <form action={registrarReferido} className="space-y-2">
            <input name="codigo" required placeholder="Código (ej REF-0001)" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white font-mono uppercase tracking-wider focus:outline-none focus:border-fma-cyan" />
            <input name="nombre" required placeholder="Nombre del nuevo cliente referido" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
            <input name="servicio" required placeholder="Servicio realizado" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
            <input name="vehiculo_dominio" placeholder="Patente vehículo (opcional)" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white uppercase focus:outline-none focus:border-fma-cyan" />
            <button type="submit" className="btn-primary w-full">Confirmar referido</button>
          </form>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(FILTER_LABEL).map(([k, v]) => (
          <Link key={k} href={k === 'todos' ? `${base}/referidos` : `${base}/referidos?filter=${k}`}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${f === k ? 'bg-fma-cyan text-fma-black' : 'bg-fma-black-3 text-fma-white-soft/80 hover:bg-fma-gray'}`}>
            {v}
          </Link>
        ))}
        <Link href={`${base}/referidos/historial`} className="ml-auto text-sm text-fma-white-soft/60 hover:text-fma-cyan self-center">
          📊 Ver historial →
        </Link>
      </div>

      {/* Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {codigos.length === 0 && (
          <div className="card col-span-full text-center py-8 text-fma-white-soft/40">Sin códigos en esta categoría</div>
        )}
        {codigos.map(({ codigo, cliente, refCount }) => {
          const n = Number(refCount);
          const pct = Math.min(100, (n / 3) * 100);
          const estado = codigo.premiado ? 'premiado' : n >= 3 ? 'completo' : n > 0 ? 'progreso' : 'pendiente';
          const badgeCls = {
            premiado: 'bg-green-500/30 text-green-300 border border-green-500',
            completo: 'bg-green-500/20 text-green-300',
            progreso: 'bg-fma-cyan/20 text-fma-cyan',
            pendiente: 'bg-fma-gray text-fma-white-soft/60',
          }[estado];
          const badgeText = {
            premiado: '✅ Premiado',
            completo: '🎉 Completo',
            progreso: `${n}/3`,
            pendiente: 'Sin referidos',
          }[estado];

          return (
            <Link key={codigo.id} href={`${base}/referidos/${codigo.id}`} className={`card hover:border-fma-cyan transition-colors ${estado === 'completo' || estado === 'premiado' ? 'border-green-500/50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-fma-white">{cliente.nombre}</div>
                  <div className="text-xs text-fma-white-soft/60">{cliente.telefono || '—'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${badgeCls}`}>{badgeText}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-fma-cyan tracking-wider mb-3">{codigo.codigo}</div>
              <div className="mb-1 flex justify-between text-xs text-fma-white-soft/60">
                <span>Progreso</span>
                <span>{n}/3</span>
              </div>
              <div className="h-2 bg-fma-black-3 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all ${n >= 3 ? 'bg-green-400' : 'bg-fma-cyan'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className={`flex-1 h-7 rounded text-xs flex items-center justify-center ${
                    i < n
                      ? n >= 3
                        ? 'bg-green-500/15 border border-green-500 text-green-300'
                        : 'bg-fma-cyan/15 border border-fma-cyan text-fma-cyan'
                      : 'border border-dashed border-fma-gray text-fma-white-soft/40'
                  }`}>
                    {i < n ? '✓' : i + 1}
                  </div>
                ))}
              </div>
              {n >= 3 && !codigo.premiado && (
                <div className="mt-3 text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded px-2 py-1.5">🏆 ¡Premio esperando!</div>
              )}
              {codigo.premiado && (
                <div className="mt-3 text-xs text-green-300 bg-green-500/15 border border-green-500/40 rounded px-2 py-1.5">✅ Premio entregado</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="card flex items-center gap-3">
      <Icon className={`h-8 w-8 text-${color}`} />
      <div>
        <div className={`text-2xl font-bold text-${color}`}>{value}</div>
        <div className="text-xs text-fma-white-soft/60">{label}</div>
      </div>
    </div>
  );
}
