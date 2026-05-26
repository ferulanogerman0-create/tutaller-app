import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createPresupuesto } from '@/lib/actions/presupuestos';
import { db, schema } from '@/lib/db';
import { eq, and, ne } from 'drizzle-orm';
import { ClienteVehiculoPicker } from '@/components/cliente-vehiculo-picker';
import { getSessionUser } from '@/lib/auth';

export default async function NuevoPresupuestoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const me = await getSessionUser();
  const tecnicos = await db.select({ id: schema.users.id, nombre: schema.users.nombre, role: schema.users.role })
    .from(schema.users)
    .where(and(
      eq(schema.users.tenantId, me!.tenantId),
      eq(schema.users.activo, true),
      ne(schema.users.role, 'contable'),
    ));

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/presupuestos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-2">Nuevo presupuesto</h1>
      <p className="text-fma-white-soft/60 mb-6">Cargá ítems estimados. Cliente aprueba → se convierte en orden con todos los datos.</p>
      <form className="card space-y-4" action={createPresupuesto}>
        <ClienteVehiculoPicker />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Concepto</label>
            <select name="concepto" defaultValue="REPARACION" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              {['REPARACION','SERVICE','MANTENIMIENTO','REVISION','GARANTIA','OTRO'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Técnico estimado</label>
            <select name="tecnico_id" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="">—</option>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-fma-white-soft/80">Observaciones</label>
          <textarea name="observaciones" rows={3} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Crear presupuesto</button>
        </div>
      </form>
    </div>
  );
}
