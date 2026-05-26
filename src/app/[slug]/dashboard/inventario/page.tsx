import { Search, AlertTriangle } from 'lucide-react';
import { listItems, listStockBajo, createInventarioItem } from '@/lib/actions/inventario';
import { StockRow } from './stock-row';

export const dynamic = 'force-dynamic';

export default async function InventarioPage({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string }> }) {
  const { q, tipo } = await searchParams;
  const items = await listItems(q);
  const stockBajo = await listStockBajo();
  const filtered = tipo ? items.filter(i => i.tipo === tipo && i.activo) : items.filter(i => i.activo);
  const servicios = items.filter(i => i.tipo === 'servicio' && i.activo).length;
  const repuestos = items.filter(i => i.tipo === 'repuesto' && i.activo).length;

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Inventario</h1>

      {stockBajo.length > 0 && (
        <div className="card mb-4 border-2 border-red-500/40">
          <h2 className="text-lg font-bold text-red-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Stock bajo ({stockBajo.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {stockBajo.map((i) => (
              <div key={i.id} className="bg-fma-black-3 rounded p-2 flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="text-fma-white truncate">{i.nombre}</div>
                  <div className="text-xs text-fma-white-soft/50">Mín: {i.stockMinimo}</div>
                </div>
                <div className="text-red-400 font-bold font-mono flex-shrink-0">{i.stock}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Total items" value={(servicios + repuestos).toString()} />
        <KPI label="Servicios" value={servicios.toString()} color="text-fma-cyan" />
        <KPI label="Repuestos" value={repuestos.toString()} color="text-fma-cyan" />
        <KPI label="Stock bajo" value={stockBajo.length.toString()} color={stockBajo.length > 0 ? 'text-red-400' : 'text-green-400'} />
      </div>

      <form action={createInventarioItem} className="card mb-4 grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
        <input name="codigo" placeholder="Código" className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        <input name="nombre" required placeholder="Nombre *" className="col-span-2 bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        <select name="tipo" defaultValue="repuesto" className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white">
          <option value="servicio">Servicio</option>
          <option value="repuesto">Repuesto</option>
        </select>
        <input name="precio" type="number" step="0.01" required placeholder="Precio *" className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        <input name="stock" type="number" placeholder="Stock" className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        <input name="stock_minimo" type="number" defaultValue="0" placeholder="Mín" className="bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1.5 text-sm text-fma-white" />
        <button type="submit" className="btn-primary text-sm col-span-2 md:col-span-7">+ Agregar item</button>
      </form>

      <form className="card mb-4 flex gap-2">
        <Search className="h-4 w-4 text-fma-white-soft/50 self-center" />
        <input name="q" defaultValue={q || ''} placeholder="Buscar por nombre o código..."
          className="flex-1 bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-sm text-fma-white" />
        <select name="tipo" defaultValue={tipo || ''} className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-sm text-fma-white">
          <option value="">Todos</option>
          <option value="servicio">Servicios</option>
          <option value="repuesto">Repuestos</option>
        </select>
        <button type="submit" className="btn-primary text-sm">Filtrar</button>
      </form>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Código</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-center px-3 py-2">Stock</th>
                <th className="text-center px-3 py-2">Mín</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-fma-white-soft/40">Sin resultados</td></tr>}
              {filtered.map((it) => (
                <StockRow key={it.id} item={{
                  id: it.id, codigo: it.codigo, nombre: it.nombre,
                  tipo: it.tipo as 'servicio' | 'repuesto', precio: it.precio,
                  categoria: it.categoria, stock: it.stock, stockMinimo: it.stockMinimo,
                }} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, color = 'text-fma-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase text-fma-white-soft/50 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
