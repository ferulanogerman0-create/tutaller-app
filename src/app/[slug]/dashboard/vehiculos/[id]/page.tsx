import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { VehiculoForm } from '@/components/vehiculo-form';
import { getVehiculo, getVehiculoOrdenes, updateVehiculo } from '@/lib/actions/vehiculos';
import { db, schema } from '@/lib/db';
import { asc, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export default async function VehiculoDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const vid = Number(id);
  const vehiculo = await getVehiculo(vid);
  if (!vehiculo) notFound();
  const ordenes = await getVehiculoOrdenes(vid);
  const me = await getSessionUser();
  const clientes = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(eq(schema.clientes.tenantId, me!.tenantId))
    .orderBy(asc(schema.clientes.nombre));

  const update = updateVehiculo.bind(null, vid);

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/vehiculos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-1">
        <span className="font-mono">{vehiculo.dominio}</span> — {vehiculo.marca} {vehiculo.modelo}
      </h1>
      <p className="text-fma-white-soft/60 mb-6">ID interno: {vehiculo.id}</p>

      <div className="space-y-6">
        <VehiculoForm initial={vehiculo} clientes={clientes} action={update} />

        <div>
          <h2 className="text-xl font-bold text-fma-white mb-3">Historial órdenes ({ordenes.length})</h2>
          {ordenes.length === 0 ? (
            <p className="text-fma-white-soft/40">Sin órdenes registradas.</p>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-fma-black-3 text-fma-white-soft/60 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Comprobante</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-left px-4 py-3">Fecha ingreso</th>
                    <th className="text-right px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => (
                    <tr key={o.id} className="border-t border-fma-gray hover:bg-fma-black-3">
                      <td className="px-4 py-3"><Link href={`${base}/ordenes/${o.id}`} className="text-fma-cyan hover:underline">{o.comprobante}</Link></td>
                      <td className="px-4 py-3 text-fma-white-soft/80 capitalize">{o.estado.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-fma-white-soft/80">{o.fechaIngreso.toLocaleDateString('es-AR')}</td>
                      <td className="px-4 py-3 text-right text-fma-white-soft/80">${Number(o.totalBruto).toLocaleString('es-AR')}</td>
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
