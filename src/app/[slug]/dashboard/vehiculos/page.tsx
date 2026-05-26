import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { listVehiculos } from '@/lib/actions/vehiculos';
import { db, schema } from '@/lib/db';
import { and, eq, inArray } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export default async function VehiculosPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { q } = await searchParams;
  const user = await getSessionUser();
  const vehiculos = await listVehiculos(q);

  const clienteIds = Array.from(new Set(vehiculos.map((v) => v.clienteId).filter(Boolean) as number[]));
  const clientesMap = new Map<number, string>();
  if (clienteIds.length > 0 && user) {
    const rows = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
      .from(schema.clientes)
      .where(and(eq(schema.clientes.tenantId, user.tenantId), inArray(schema.clientes.id, clienteIds)));
    for (const r of rows) clientesMap.set(r.id, r.nombre);
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Vehículos</h1>
        <Link href={`${base}/vehiculos/nuevo`} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo vehículo
        </Link>
      </div>

      <form className="mb-4 flex gap-2" method="GET">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-fma-white-soft/40" />
          <input
            name="q"
            defaultValue={q || ''}
            placeholder="Buscar dominio, marca, modelo..."
            className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md pl-9 pr-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
          />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-fma-black-3 text-fma-white-soft/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Dominio</th>
              <th className="text-left px-4 py-3">Marca / Modelo</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Año</th>
              <th className="text-left px-4 py-3">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-fma-white-soft/40">Sin resultados</td></tr>
            )}
            {vehiculos.map((v) => (
              <tr key={v.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                <td className="px-4 py-3">
                  <Link href={`${base}/vehiculos/${v.id}`} className="text-fma-cyan hover:underline font-mono font-medium">
                    {v.dominio}
                  </Link>
                </td>
                <td className="px-4 py-3 text-fma-white-soft/80">
                  {v.marca || '—'} {v.modelo || ''}
                </td>
                <td className="px-4 py-3 text-fma-white-soft/80">
                  {v.clienteId ? (clientesMap.get(v.clienteId) || `#${v.clienteId}`) : '—'}
                </td>
                <td className="px-4 py-3 text-fma-white-soft/80">{v.anio || '—'}</td>
                <td className="px-4 py-3 text-fma-white-soft/80">{v.tipo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
