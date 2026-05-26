import Link from 'next/link';
import { Search, ArrowRight, Plus } from 'lucide-react';
import { listProveedores, createProveedor } from '@/lib/actions/proveedores';

export const dynamic = 'force-dynamic';

export default async function ProveedoresPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { q } = await searchParams;
  const proveedores = await listProveedores(q);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Proveedores</h1>

      <div className="card mb-4">
        <h2 className="text-lg font-bold text-fma-white mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo proveedor
        </h2>
        <form action={createProveedor} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input name="nombre" required placeholder="Nombre *" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white md:col-span-2" />
          <input name="rubro" placeholder="Rubro (repuestos, lubricantes, etc.)" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="telefono" placeholder="Teléfono" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="cuit" placeholder="CUIT" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="email" placeholder="Email" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="direccion" placeholder="Dirección" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white md:col-span-2" />
          <button type="submit" className="btn-primary text-sm md:col-span-4">Crear proveedor</button>
        </form>
      </div>

      <form className="card mb-4 flex gap-2">
        <Search className="h-4 w-4 text-fma-white-soft/50 self-center" />
        <input name="q" defaultValue={q || ''} placeholder="Buscar por nombre, CUIT, rubro..."
          className="flex-1 bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-sm text-fma-white" />
        <button type="submit" className="btn-primary text-sm">Buscar</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Proveedores ({proveedores.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Rubro</th>
                <th className="text-left px-4 py-2">Teléfono</th>
                <th className="text-left px-4 py-2">CUIT</th>
                <th className="text-right px-4 py-2">Saldo</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-fma-white-soft/40">Sin proveedores</td></tr>}
              {proveedores.map((p) => (
                <tr key={p.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                  <td className="px-4 py-2 text-fma-white">{p.nombre}</td>
                  <td className="px-4 py-2 text-fma-white-soft/80">{p.rubro || '—'}</td>
                  <td className="px-4 py-2 text-fma-white-soft/80">{p.telefono || '—'}</td>
                  <td className="px-4 py-2 text-fma-white-soft/60 font-mono text-xs">{p.cuit || '—'}</td>
                  <td className={`px-4 py-2 text-right font-bold ${Number(p.saldo) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    ${Number(p.saldo).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`${base}/proveedores/${p.id}`} className="text-fma-cyan hover:text-fma-white">
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
