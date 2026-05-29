import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getSlug } from '@/lib/actions/_ctx';
import { listAuditLog } from '@/lib/actions/audit-list';

export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, { txt: string; cls: string }> = {
  'orden.create': { txt: 'Creó orden', cls: 'bg-blue-500/20 text-blue-300' },
  'orden.update': { txt: 'Editó orden', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'orden.delete': { txt: 'Eliminó orden', cls: 'bg-red-500/20 text-red-300' },
  'orden.item.add': { txt: 'Agregó item', cls: 'bg-green-500/20 text-green-300' },
  'orden.item.update': { txt: 'Editó item', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'orden.item.delete': { txt: 'Eliminó item', cls: 'bg-red-500/20 text-red-300' },
  'cliente.create': { txt: 'Creó cliente', cls: 'bg-blue-500/20 text-blue-300' },
  'cliente.update': { txt: 'Editó cliente', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'vehiculo.create': { txt: 'Creó vehículo', cls: 'bg-blue-500/20 text-blue-300' },
  'vehiculo.update': { txt: 'Editó vehículo', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'caja.movimiento': { txt: 'Movimiento caja', cls: 'bg-green-500/20 text-green-300' },
  'caja.apertura': { txt: 'Abrió caja', cls: 'bg-green-500/20 text-green-300' },
  'caja.cierre': { txt: 'Cerró caja', cls: 'bg-orange-500/20 text-orange-300' },
  'config.update': { txt: 'Cambió config', cls: 'bg-purple-500/20 text-purple-300' },
  'user.create': { txt: 'Creó usuario', cls: 'bg-blue-500/20 text-blue-300' },
  'user.update': { txt: 'Editó usuario', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'referido.create': { txt: 'Nuevo referido', cls: 'bg-green-500/20 text-green-300' },
  'referido.premio': { txt: 'Entregó premio', cls: 'bg-yellow-500/20 text-yellow-300' },
  'inventario.create': { txt: 'Item nuevo', cls: 'bg-blue-500/20 text-blue-300' },
  'inventario.update': { txt: 'Editó item', cls: 'bg-fma-cyan/20 text-fma-cyan' },
  'inventario.delete': { txt: 'Eliminó item', cls: 'bg-red-500/20 text-red-300' },
};

function entityHref(slug: string, t: string | null, id: number | null): string | null {
  if (!id) return null;
  const base = `/${slug}/dashboard`;
  if (t === 'orden') return `${base}/ordenes/${id}`;
  if (t === 'cliente') return `${base}/clientes/${id}`;
  if (t === 'vehiculo') return `${base}/vehiculos/${id}`;
  if (t === 'inventario') return `${base}/inventario`;
  return null;
}

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ user?: string; entity?: string; days?: string }> }) {
  const slug = await getSlug();
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);
  if (me.role !== 'admin' && me.role !== 'owner') redirect(`/${slug}/dashboard`);

  const { user, entity, days } = await searchParams;
  const rows = await listAuditLog({
    userId: user ? Number(user) : undefined,
    entityType: entity,
    days: days ? Number(days) : 30,
  });

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Auditoría</h1>

      <form className="card mb-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-fma-white-soft/60 mb-1">Entidad</label>
          <select name="entity" defaultValue={entity || ''} className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-sm text-fma-white">
            <option value="">Todas</option>
            <option value="orden">Órdenes</option>
            <option value="cliente">Clientes</option>
            <option value="vehiculo">Vehículos</option>
            <option value="caja">Caja</option>
            <option value="config">Config</option>
            <option value="inventario">Inventario</option>
            <option value="referido">Referidos</option>
            <option value="user">Usuarios</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-fma-white-soft/60 mb-1">Últimos días</label>
          <select name="days" defaultValue={days || '30'} className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-sm text-fma-white">
            <option value="1">1 día</option>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm">Filtrar</button>
        <div className="ml-auto text-sm text-fma-white-soft/60">{rows.length} eventos</div>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Usuario</th>
                <th className="text-left px-4 py-2">Acción</th>
                <th className="text-left px-4 py-2">Entidad</th>
                <th className="text-left px-4 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-fma-white-soft/40">Sin actividad</td></tr>}
              {rows.map((r) => {
                const a = ACTION_LABEL[r.action];
                const href = entityHref(slug, r.entityType, r.entityId);
                return (
                  <tr key={r.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                    <td className="px-4 py-1.5 text-xs text-fma-white-soft/80 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-1.5 text-fma-white">{r.userName || <span className="text-fma-white-soft/40">—</span>}</td>
                    <td className="px-4 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${a?.cls || 'bg-fma-gray text-fma-white-soft'}`}>
                        {a?.txt || r.action}
                      </span>
                    </td>
                    <td className="px-4 py-1.5">
                      {href ? (
                        <Link href={href} className="text-fma-cyan hover:underline text-xs">
                          {r.entityType} #{r.entityId}
                        </Link>
                      ) : <span className="text-fma-white-soft/60 text-xs">{r.entityType}{r.entityId ? ` #${r.entityId}` : ''}</span>}
                    </td>
                    <td className="px-4 py-1.5 text-xs text-fma-white-soft/60 max-w-[400px] truncate">
                      {r.payload ? JSON.stringify(r.payload).slice(0, 150) : '—'}
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
