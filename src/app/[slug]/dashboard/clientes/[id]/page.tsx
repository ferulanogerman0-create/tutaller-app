import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ClienteForm } from '@/components/cliente-form';
import { getCliente, getClienteVehiculos, updateCliente } from '@/lib/actions/clientes';
import { db, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const clienteId = Number(id);
  const cliente = await getCliente(clienteId);
  if (!cliente) notFound();
  const vehiculos = await getClienteVehiculos(clienteId);
  const me = await getSessionUser();
  const ordenes = await db.select({
    id: schema.ordenes.id,
    comprobante: schema.ordenes.comprobante,
    fechaIngreso: schema.ordenes.fechaIngreso,
    estado: schema.ordenes.estado,
    pagoEstado: schema.ordenes.pagoEstado,
    totalBruto: schema.ordenes.totalBruto,
    vehDominio: schema.vehiculos.dominio,
  })
    .from(schema.ordenes)
    .leftJoin(schema.vehiculos, eq(schema.ordenes.vehiculoId, schema.vehiculos.id))
    .where(and(eq(schema.ordenes.tenantId, me!.tenantId), eq(schema.ordenes.clienteId, clienteId)))
    .orderBy(desc(schema.ordenes.fechaIngreso))
    .limit(200);

  const totalFact = ordenes.reduce((s, o) => s + Number(o.totalBruto || 0), 0);

  const update = updateCliente.bind(null, clienteId);

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/clientes`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-1">{cliente.nombre}</h1>
      <p className="text-fma-white-soft/60 mb-6">
        ID: {cliente.id} · Saldo CC: <span className={Number(cliente.saldoCuentaCorriente) > 0 ? 'text-orange-400' : 'text-green-400'}>${Number(cliente.saldoCuentaCorriente).toLocaleString('es-AR')}</span>
        {' · '}{ordenes.length} órdenes · Facturado total: <span className="text-fma-cyan">${totalFact.toLocaleString('es-AR')}</span>
      </p>

      <div className="space-y-6">
        <ClienteForm initial={cliente} action={update} />

        <div>
          <h2 className="text-xl font-bold text-fma-white mb-3">Historial de órdenes ({ordenes.length})</h2>
          {ordenes.length === 0 ? (
            <p className="text-fma-white-soft/40">Sin órdenes.</p>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-fma-black-3 text-fma-white-soft/50 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Comprobante</th>
                      <th className="text-left px-4 py-2">Fecha</th>
                      <th className="text-left px-4 py-2">Vehículo</th>
                      <th className="text-left px-4 py-2">Estado</th>
                      <th className="text-left px-4 py-2">Pago</th>
                      <th className="text-right px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o) => (
                      <tr key={o.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                        <td className="px-4 py-1.5">
                          <Link href={`${base}/ordenes/${o.id}`} className="font-mono text-fma-cyan hover:underline">{o.comprobante}</Link>
                        </td>
                        <td className="px-4 py-1.5 text-xs text-fma-white-soft/80">{new Date(o.fechaIngreso).toLocaleDateString('es-AR')}</td>
                        <td className="px-4 py-1.5 font-mono text-xs text-fma-white-soft/80">{o.vehDominio || '—'}</td>
                        <td className="px-4 py-1.5 capitalize text-fma-white-soft">{o.estado.replace('_', ' ')}</td>
                        <td className={`px-4 py-1.5 capitalize ${o.pagoEstado === 'pagado' ? 'text-green-400' : o.pagoEstado === 'parcial' ? 'text-orange-400' : 'text-red-400'}`}>{o.pagoEstado}</td>
                        <td className="px-4 py-1.5 text-right text-green-400 font-bold">${Number(o.totalBruto).toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-fma-white mb-3">Vehículos</h2>
          {vehiculos.length === 0 ? (
            <p className="text-fma-white-soft/40">Sin vehículos asociados.</p>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-fma-black-3 text-fma-white-soft/60 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Dominio</th>
                    <th className="text-left px-4 py-3">Marca</th>
                    <th className="text-left px-4 py-3">Modelo</th>
                    <th className="text-left px-4 py-3">Año</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiculos.map((v) => (
                    <tr key={v.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                      <td className="px-4 py-3">
                        <Link href={`${base}/vehiculos/${v.id}`} className="text-fma-cyan hover:underline font-mono">
                          {v.dominio}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-fma-white-soft/80">{v.marca || '—'}</td>
                      <td className="px-4 py-3 text-fma-white-soft/80">{v.modelo || '—'}</td>
                      <td className="px-4 py-3 text-fma-white-soft/80">{v.anio || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
