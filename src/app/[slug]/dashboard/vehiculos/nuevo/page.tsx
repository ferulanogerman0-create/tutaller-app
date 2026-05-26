import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VehiculoForm } from '@/components/vehiculo-form';
import { createVehiculo } from '@/lib/actions/vehiculos';
import { db, schema } from '@/lib/db';
import { asc, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export default async function NuevoVehiculoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const me = await getSessionUser();
  const clientes = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(eq(schema.clientes.tenantId, me!.tenantId))
    .orderBy(asc(schema.clientes.nombre));
  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/vehiculos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-6">Nuevo vehículo</h1>
      <VehiculoForm clientes={clientes} action={createVehiculo} />
    </div>
  );
}
