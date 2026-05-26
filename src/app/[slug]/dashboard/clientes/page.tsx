import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { listClientes } from '@/lib/actions/clientes';

export default async function ClientesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { q } = await searchParams;
  const clientes = await listClientes(q);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-fma-white">Clientes</h1>
        <Link href={`${base}/clientes/nuevo`} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      <form className="mb-4 flex gap-2 items-center" method="GET">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-fma-white-soft/40" />
          <input
            name="q"
            defaultValue={q || ''}
            placeholder="Buscar nombre, DNI, teléfono..."
            className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md pl-9 pr-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
          />
        </div>
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-fma-black-3 text-fma-white-soft/60 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">DNI</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Localidad</th>
              <th className="text-right px-4 py-3">Saldo CC</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-fma-white-soft/40">Sin resultados</td></tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-fma-gray hover:bg-fma-black-3 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`${base}/clientes/${c.id}`} className="text-fma-cyan hover:underline font-medium">
                    {c.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-fma-white-soft/80">{c.dni || '—'}</td>
                <td className="px-4 py-3 text-fma-white-soft/80">{c.telefono || '—'}</td>
                <td className="px-4 py-3 text-fma-white-soft/80">{c.localidad || '—'}</td>
                <td className="px-4 py-3 text-right text-fma-white-soft/80">${Number(c.saldoCuentaCorriente).toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
