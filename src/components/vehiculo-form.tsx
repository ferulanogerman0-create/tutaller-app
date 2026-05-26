'use client';
import { useTransition } from 'react';
import type { InferSelectModel } from 'drizzle-orm';
import { schema } from '@/lib/db';

type Vehiculo = InferSelectModel<typeof schema.vehiculos>;

export function VehiculoForm({
  initial,
  clientes,
  action,
}: {
  initial?: Partial<Vehiculo>;
  clientes: { id: number; nombre: string }[];
  action: (fd: FormData) => Promise<void>;
}) {
  const [isPending, start] = useTransition();
  return (
    <form className="card space-y-4" action={(fd) => start(() => action(fd))}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1 text-fma-white-soft/80">Dominio *</label>
          <input name="dominio" required defaultValue={initial?.dominio} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white uppercase focus:outline-none focus:border-fma-cyan" />
        </div>
        <div>
          <label className="block text-sm mb-1 text-fma-white-soft/80">Cliente</label>
          <select name="cliente_id" defaultValue={initial?.clienteId || ''} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
            <option value="">— Sin asociar —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <Field name="marca" label="Marca" defaultValue={initial?.marca || ''} />
        <Field name="modelo" label="Modelo" defaultValue={initial?.modelo || ''} />
        <Field name="tipo" label="Tipo (Auto/SUV/Camioneta)" defaultValue={initial?.tipo || ''} />
        <Field name="color" label="Color" defaultValue={initial?.color || ''} />
        <Field name="anio" label="Año" type="number" defaultValue={initial?.anio?.toString() || ''} />
        <Field name="kilometraje" label="Kilometraje" type="number" defaultValue={initial?.kilometraje?.toString() || ''} />
        <Field name="combustible" label="Combustible" defaultValue={initial?.combustible || ''} />
        <Field name="motor" label="Nº motor" defaultValue={initial?.motor || ''} />
        <Field name="chasis" label="Nº chasis" defaultValue={initial?.chasis || ''} className="md:col-span-2" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-50">
          {isPending ? 'Guardando...' : initial?.id ? 'Actualizar' : 'Crear vehículo'}
        </button>
      </div>
    </form>
  );
}

function Field(props: { name: string; label: string; type?: string; defaultValue?: string; className?: string }) {
  return (
    <div className={props.className}>
      <label className="block text-sm mb-1 text-fma-white-soft/80">{props.label}</label>
      <input
        name={props.name}
        type={props.type || 'text'}
        defaultValue={props.defaultValue}
        className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
      />
    </div>
  );
}
