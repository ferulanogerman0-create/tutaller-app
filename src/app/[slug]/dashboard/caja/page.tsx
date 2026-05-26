import Link from 'next/link';
import { listMovimientos, createMovimiento } from '@/lib/actions/caja';
import { getResumenCajaActiva, abrirCaja, cerrarCaja } from '@/lib/actions/cierres';
import { Plus, Lock, Unlock, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CajaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const resumen = await getResumenCajaActiva();
  const movs = await listMovimientos();

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-fma-white">Caja</h1>
        <div className="flex gap-3 items-center">
          <form action="/api/admin/sync-caja-ordenes?scope=hoy" method="POST" className="inline">
            <button type="submit" className="text-xs text-fma-cyan hover:underline">Sync órdenes entregadas hoy →</button>
          </form>
          <form action="/api/admin/fix-fechas-egreso" method="POST" className="inline">
            <button type="submit" className="text-xs text-yellow-300 hover:underline" title="Usa fechaIngreso">Fix fechas (ingreso) →</button>
          </form>
          <form action="/api/admin/fix-fechas-cierres" method="POST" className="inline">
            <button type="submit" className="text-xs text-green-300 hover:underline" title="Mapea cada orden a su fecha de cierre real DIRUP por id_caja">Fix fechas (cierres DIRUP) →</button>
          </form>
          <Link href={`${base}/cierres`} className="text-sm text-fma-cyan hover:underline flex items-center gap-1">
            <History className="h-4 w-4" /> Cierres
          </Link>
        </div>
      </div>

      {!resumen && (
        <div className="card mb-6 border-2 border-yellow-500/40">
          <h2 className="text-xl font-bold text-yellow-300 mb-2 flex items-center gap-2">
            <Unlock className="h-5 w-5" /> Caja cerrada
          </h2>
          <p className="text-fma-white-soft/60 mb-3">Abrí caja para empezar a registrar movimientos.</p>
          <form action={abrirCaja} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-fma-white-soft/60 mb-1">Saldo inicial</label>
              <input name="saldo_inicial" type="number" step="0.01" defaultValue={0} required
                className="bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-fma-white" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-fma-white-soft/60 mb-1">Notas</label>
              <input name="notas" placeholder="Apertura del día..."
                className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-1.5 text-fma-white" />
            </div>
            <button type="submit" className="btn-primary">Abrir caja</button>
          </form>
        </div>
      )}

      {resumen && (
        <>
          <div className="card mb-4 border-2 border-green-500/40">
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-green-300 flex items-center gap-2">
                <Lock className="h-5 w-5" /> Caja abierta desde {new Date(resumen.activa.fechaApertura).toLocaleString('es-AR')}
              </h2>
              <details className="relative">
                <summary className="cursor-pointer btn-secondary text-sm">Cerrar caja</summary>
                <div className="absolute right-0 top-10 z-10 bg-fma-black-2 border border-fma-gray rounded-lg p-4 w-80 shadow-xl">
                  <form action={cerrarCaja} className="space-y-2">
                    <div>
                      <label className="block text-xs text-fma-white-soft/60 mb-1">Saldo contado</label>
                      <input name="saldo_contado" type="number" step="0.01" defaultValue={resumen.saldoEsperado}
                        className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1 text-fma-white" />
                      <div className="text-xs text-fma-white-soft/50 mt-1">Esperado: ${resumen.saldoEsperado.toLocaleString('es-AR')}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-fma-white-soft/60 mb-1">Notas</label>
                      <textarea name="notas" rows={2} className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-2 py-1 text-fma-white text-sm" />
                    </div>
                    <button type="submit" className="btn-primary w-full text-sm">Confirmar cierre</button>
                  </form>
                </div>
              </details>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Saldo inicial" value={`$${Number(resumen.activa.saldoInicial).toLocaleString('es-AR')}`} />
              <Stat label="Ingresos" value={`$${resumen.ingresos.toLocaleString('es-AR')}`} color="text-green-400" />
              <Stat label="Egresos" value={`$${resumen.egresos.toLocaleString('es-AR')}`} color="text-red-400" />
              <Stat label="Movimientos" value={resumen.movimientos.toString()} />
              <Stat label="Saldo esperado" value={`$${resumen.saldoEsperado.toLocaleString('es-AR')}`} color="text-fma-cyan" />
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="text-lg font-bold text-fma-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nuevo movimiento
            </h3>
            <form action={createMovimiento} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs text-fma-white-soft/60 mb-1">Detalle</label>
                <input name="detalle" required placeholder="Concepto..."
                  className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
              </div>
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Efectivo</label>
                <input name="efectivo" type="number" step="0.01" defaultValue={0}
                  className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
              </div>
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Otro medio</label>
                <select name="otro_medio" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
                  <option value="">—</option>
                  {['Tarjeta crédito','Tarjeta débito','Transferencia','Cheque','MercadoPago','Otro'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Monto otro</label>
                <input name="otro_monto" type="number" step="0.01" defaultValue={0}
                  className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
              </div>
              <div className="md:col-span-5 flex justify-between items-center">
                <p className="text-xs text-fma-white-soft/40">Para egreso, usar montos negativos</p>
                <button type="submit" className="btn-primary">Registrar movimiento</button>
              </div>
            </form>
          </div>
        </>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-fma-gray bg-fma-black-3 text-sm font-semibold text-fma-white">
          Movimientos recientes
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Detalle</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-right px-4 py-2">Efectivo</th>
                <th className="text-left px-4 py-2">Otro medio</th>
                <th className="text-right px-4 py-2">Otro monto</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-center px-4 py-2">Cierre</th>
              </tr>
            </thead>
            <tbody>
              {movs.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-fma-white-soft/40">Sin movimientos</td></tr>}
              {movs.map((m) => (
                <tr key={m.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                  <td className="px-4 py-2 text-fma-white-soft/80 text-xs">{new Date(m.createdAt).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2 text-fma-white">{m.detalle}</td>
                  <td className={`px-4 py-2 capitalize ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{m.tipo}</td>
                  <td className="px-4 py-2 text-right">${Number(m.efectivo).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-2 text-fma-white-soft/80">{m.otroMedio || '—'}</td>
                  <td className="px-4 py-2 text-right">${Number(m.otroMonto).toLocaleString('es-AR')}</td>
                  <td className={`px-4 py-2 text-right font-bold ${Number(m.total) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Number(m.total).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    {m.cierreId ? <span className="text-fma-white-soft/40">#{m.cierreId}</span> : <span className="text-yellow-400">Abierto</span>}
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

function Stat({ label, value, color = 'text-fma-white' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-fma-white-soft/50 mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
