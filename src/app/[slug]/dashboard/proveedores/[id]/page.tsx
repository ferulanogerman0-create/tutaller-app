import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProveedor, updateProveedor, registrarCompra, eliminarProveedor } from '@/lib/actions/proveedores';

export const dynamic = 'force-dynamic';

export default async function ProveedorDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const pid = Number(id);
  const data = await getProveedor(pid);
  if (!data) notFound();

  const update = updateProveedor.bind(null, pid);
  const del = eliminarProveedor.bind(null, pid);
  const saldo = Number(data.saldo);

  return (
    <div className="p-6 max-w-[1200px]">
      <Link href={`${base}/proveedores`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-fma-white">{data.nombre}</h1>
        <div className="text-right">
          <div className="text-xs uppercase text-fma-white-soft/50">Saldo</div>
          <div className={`text-3xl font-bold ${saldo > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            ${saldo.toLocaleString('es-AR')}
          </div>
          <div className="text-xs text-fma-white-soft/50">{saldo > 0 ? 'Debemos' : 'Saldo limpio'}</div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-fma-white mb-3">Editar datos</h2>
        <form action={update} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="nombre" required defaultValue={data.nombre} placeholder="Nombre *" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white md:col-span-2" />
          <input name="rubro" defaultValue={data.rubro || ''} placeholder="Rubro" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="cuit" defaultValue={data.cuit || ''} placeholder="CUIT" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="telefono" defaultValue={data.telefono || ''} placeholder="Teléfono" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="email" defaultValue={data.email || ''} placeholder="Email" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <input name="direccion" defaultValue={data.direccion || ''} placeholder="Dirección" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white md:col-span-2" />
          <textarea name="comentario" defaultValue={data.comentario || ''} rows={2} placeholder="Comentario" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white md:col-span-3" />
          <div className="md:col-span-3 flex justify-between">
            <button type="submit" className="btn-primary text-sm">Guardar</button>
          </div>
        </form>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-fma-white mb-3">Registrar compra</h2>
        <form action={registrarCompra} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <input type="hidden" name="proveedor_id" value={pid} />
          <input name="monto" type="number" step="0.01" required placeholder="Monto *" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <select name="medio" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white">
            <option value="efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta crédito">Tarjeta crédito</option>
            <option value="Tarjeta débito">Tarjeta débito</option>
            <option value="Cheque">Cheque</option>
            <option value="MercadoPago">MercadoPago</option>
          </select>
          <select name="categoria" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white">
            <option value="Repuestos">Repuestos</option>
            <option value="Herramientas">Herramientas</option>
            <option value="Insumos">Insumos</option>
            <option value="Servicios">Servicios</option>
            <option value="Otro gasto">Otro gasto</option>
          </select>
          <input name="detalle" placeholder="Detalle / factura" className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-sm text-fma-white" />
          <button type="submit" className="btn-primary text-sm">Registrar</button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Historial movimientos ({data.movimientos.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Detalle</th>
                <th className="text-left px-4 py-2">Categoría</th>
                <th className="text-right px-4 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.movimientos.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-fma-white-soft/40">Sin movimientos</td></tr>}
              {data.movimientos.map((m) => (
                <tr key={m.id} className="border-t border-fma-gray">
                  <td className="px-4 py-1.5 text-xs text-fma-white-soft/80">{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-1.5 text-fma-white">{m.detalle}</td>
                  <td className="px-4 py-1.5 text-fma-white-soft/80">{m.categoria || '—'}</td>
                  <td className="px-4 py-1.5 text-right font-bold text-red-400">${Number(m.total).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <form action={del}>
          <button type="submit" className="text-xs text-red-400 hover:underline">Eliminar proveedor</button>
        </form>
      </div>
    </div>
  );
}
