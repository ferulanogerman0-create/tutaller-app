import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getClienteCtaCte, registrarPagoCliente } from '@/lib/actions/cuentas-corrientes';

export const dynamic = 'force-dynamic';

export default async function ClienteCtaCtePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const data = await getClienteCtaCte(Number(id));
  if (!data) notFound();
  const { cliente, ordenes } = data;
  const saldo = Number(cliente.saldoCuentaCorriente);

  return (
    <div className="p-6 max-w-[1200px]">
      <Link href={`${base}/cuentas-corrientes`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-fma-white">{cliente.nombre}</h1>
          <p className="text-fma-white-soft/60 text-sm">
            DNI: {cliente.dni || '—'} · Tel: {cliente.telefono || '—'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-fma-white-soft/50">Saldo cuenta corriente</div>
          <div className={`text-4xl font-bold ${saldo > 0 ? 'text-orange-400' : saldo < 0 ? 'text-green-400' : 'text-fma-white'}`}>
            ${saldo.toLocaleString('es-AR')}
          </div>
          {saldo > 0 && <div className="text-xs text-fma-white-soft/50">Cliente debe</div>}
          {saldo < 0 && <div className="text-xs text-fma-white-soft/50">A favor del cliente</div>}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-fma-white mb-3">Registrar pago / cobro</h2>
        <form action={registrarPagoCliente} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <input type="hidden" name="cliente_id" value={cliente.id} />
          <div>
            <label className="block text-xs text-fma-white-soft/60 mb-1">Monto</label>
            <input name="monto" type="number" step="0.01" required defaultValue={saldo > 0 ? saldo : ''}
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white" />
          </div>
          <div>
            <label className="block text-xs text-fma-white-soft/60 mb-1">Medio</label>
            <select name="medio" className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white">
              <option value="efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta crédito">Tarjeta crédito</option>
              <option value="Tarjeta débito">Tarjeta débito</option>
              <option value="MercadoPago">MercadoPago</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-fma-white-soft/60 mb-1">Detalle</label>
            <input name="detalle" placeholder="Pago a cuenta"
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white" />
          </div>
          <button type="submit" className="btn-primary">Registrar pago</button>
        </form>
        <p className="text-xs text-fma-white-soft/40 mt-2">El pago se registra en caja y reduce el saldo del cliente.</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Historial de órdenes ({ordenes.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Comprobante</th>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-right px-4 py-2">Pagado</th>
                <th className="text-right px-4 py-2">Saldo</th>
                <th className="text-left px-4 py-2">Pago</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-fma-white-soft/40">Sin órdenes</td></tr>}
              {ordenes.map((o) => {
                const total = Number(o.total);
                const pagado = Number(o.pagoEfectivo) + Number(o.pagoOtro);
                const saldoOrd = total - pagado;
                return (
                  <tr key={o.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                    <td className="px-4 py-2">
                      <Link href={`${base}/ordenes/${o.id}`} className="font-mono text-fma-cyan hover:underline">{o.comprobante}</Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-fma-white-soft/80">{new Date(o.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-2 capitalize text-fma-white-soft">{o.estado.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-right">${total.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2 text-right text-green-400">${pagado.toLocaleString('es-AR')}</td>
                    <td className={`px-4 py-2 text-right font-bold ${saldoOrd > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      ${saldoOrd.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      <span className={
                        o.pagoEstado === 'pagado' ? 'text-green-400' :
                        o.pagoEstado === 'parcial' ? 'text-orange-400' : 'text-red-400'
                      }>{o.pagoEstado}</span>
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
