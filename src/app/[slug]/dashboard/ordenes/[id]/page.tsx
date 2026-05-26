import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getOrden, updateOrden } from '@/lib/actions/ordenes';
import { db, schema } from '@/lib/db';
import { eq, and, ne } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { OrdenActions } from './orden-actions';
import { ClienteVehiculoCard } from './cliente-vehiculo-card';
import { ItemsTable } from './items-table';
import { AddItemForm } from './add-item-form';
import { IvaBatchButton } from './iva-batch-button';
import { getTelefonoNormalizado } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function OrdenDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const oid = Number(id);
  const data = await getOrden(oid);
  if (!data) notFound();
  const { orden, cliente, vehiculo, tecnico, items } = data;

  const me = await getSessionUser();
  const tecnicos = await db.select({ id: schema.users.id, nombre: schema.users.nombre, role: schema.users.role })
    .from(schema.users)
    .where(and(
      eq(schema.users.tenantId, me!.tenantId),
      eq(schema.users.activo, true),
      ne(schema.users.role, 'contable'),
    ));

  const update = updateOrden.bind(null, oid);

  return (
    <div className="p-8 max-w-5xl">
      <Link href={`${base}/ordenes`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-fma-white font-mono">{orden.comprobante}</h1>
          <span className="text-fma-white-soft/60 text-sm">Ingreso: {orden.fechaIngreso.toLocaleString('es-AR')}</span>
        </div>
        <OrdenActions
          ordenId={orden.id}
          clienteNombre={cliente?.nombre || ''}
          telefono={getTelefonoNormalizado(cliente?.telefono || cliente?.telefonoAlt)}
          comprobante={orden.comprobante}
          total={Number(orden.totalBruto)}
          totalNeto={Number(orden.totalNeto)}
          vehiculoLabel={`${vehiculo?.marca || ''} ${vehiculo?.modelo || ''} ${vehiculo?.dominio ? '(' + vehiculo.dominio + ')' : ''}`.trim()}
        />
      </div>

      <form action={update} className="card space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Estado</label>
            <select name="estado" defaultValue={orden.estado} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              {['ingresado','diagnostico','en_reparacion','reparado','entregado'].map((e) => <option key={e} value={e}>{e.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Técnico</label>
            <select name="tecnico_id" defaultValue={orden.tecnicoId || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="">—</option>
              {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Fecha egreso</label>
            <input type="datetime-local" name="fecha_egreso" defaultValue={orden.fechaEgreso?.toISOString().slice(0,16) || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Concepto</label>
            <select name="concepto" defaultValue={orden.concepto || 'REPARACION'} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              {['REPARACION','SERVICE','MANTENIMIENTO','REVISION','GARANTIA','OTRO'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Combustible</label>
            <select name="combustible" defaultValue={orden.combustible || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="">—</option>
              {['Bajo','Cuarto','Medio','Alto','Lleno'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Kilometraje</label>
            <input name="kilometraje" type="number" defaultValue={orden.kilometraje || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
          </div>
        </div>

        <ClienteVehiculoCard
          ordenId={orden.id}
          cliente={cliente ? {
            id: cliente.id, nombre: cliente.nombre, dni: cliente.dni,
            telefono: cliente.telefono, telefonoAlt: cliente.telefonoAlt,
            email: cliente.email, domicilio: cliente.domicilio, localidad: cliente.localidad,
          } : null}
          vehiculo={vehiculo ? {
            id: vehiculo.id, dominio: vehiculo.dominio, marca: vehiculo.marca, modelo: vehiculo.modelo,
            anio: vehiculo.anio, color: vehiculo.color, tipo: vehiculo.tipo,
            kilometraje: vehiculo.kilometraje, chasis: vehiculo.chasis,
          } : null}
        />

        <div>
          <label className="block text-sm mb-1 text-fma-white-soft/80">Observaciones (cliente las ve en PDF)</label>
          <textarea name="observaciones" defaultValue={orden.observaciones || ''} rows={2} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
        </div>
        <div>
          <label className="block text-sm mb-1 text-fma-white-soft/80">Comentario interno (privado)</label>
          <textarea name="comentario_interno" defaultValue={orden.comentarioInterno || ''} rows={2} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-fma-gray">
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Pago efectivo</label>
            <input name="pago_efectivo" type="number" step="0.01" defaultValue={Number(orden.pagoEfectivo)} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Otro medio</label>
            <select name="pago_otro_medio" defaultValue={orden.pagoOtroMedio || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
              <option value="">—</option>
              {['Tarjeta crédito','Tarjeta débito','Transferencia','Cheque','Otro'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Monto otro medio</label>
            <input name="pago_otro_monto" type="number" step="0.01" defaultValue={Number(orden.pagoOtroMonto)} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Guardar cambios</button>
        </div>
      </form>

      {/* ITEMS */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-fma-white mb-3">Items / Presupuesto</h2>
        <IvaBatchButton ordenId={oid} />
        <ItemsTable items={items.map(i => ({
          id: i.id, nombre: i.nombre, tipo: i.tipo as 'servicio' | 'repuesto',
          importe: i.importe, cantidad: i.cantidad,
          bonificacionPct: i.bonificacionPct, ivaPct: i.ivaPct, subtotal: i.subtotal,
        }))} ordenId={oid} />

        <AddItemForm ordenId={oid} />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-fma-white mb-3">Resumen</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-fma-white-soft/60">Total repuestos:</span>
          <span className="text-right">${Number(orden.totalRepuestos).toLocaleString('es-AR')}</span>
          <span className="text-fma-white-soft/60">Total mano de obra:</span>
          <span className="text-right">${Number(orden.totalManoObra).toLocaleString('es-AR')}</span>
          <span className="text-fma-white-soft/60">Total neto:</span>
          <span className="text-right">${Number(orden.totalNeto).toLocaleString('es-AR')}</span>
          <span className="text-fma-white-soft/60">IVA:</span>
          <span className="text-right">${Number(orden.totalIva).toLocaleString('es-AR')}</span>
          <span className="text-fma-white font-bold border-t border-fma-gray pt-2">TOTAL:</span>
          <span className="text-right text-fma-cyan text-lg font-bold border-t border-fma-gray pt-2">${Number(orden.totalBruto).toLocaleString('es-AR')}</span>
          <span className="text-fma-white-soft/60">Pagado:</span>
          <span className="text-right">${(Number(orden.pagoEfectivo) + Number(orden.pagoOtroMonto)).toLocaleString('es-AR')}</span>
          <span className="text-fma-white-soft/60 font-bold">Saldo:</span>
          <span className="text-right text-orange-400 font-bold">${(Number(orden.totalBruto) - Number(orden.pagoEfectivo) - Number(orden.pagoOtroMonto)).toLocaleString('es-AR')}</span>
        </div>
      </div>
    </div>
  );
}
