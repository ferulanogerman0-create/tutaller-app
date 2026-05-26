'use client';
import { useTransition } from 'react';
import type { InferSelectModel } from 'drizzle-orm';
import { schema } from '@/lib/db';

type Cliente = InferSelectModel<typeof schema.clientes>;

export function ClienteForm({
  initial,
  action,
}: {
  initial?: Partial<Cliente>;
  action: (fd: FormData) => Promise<void>;
}) {
  const [isPending, start] = useTransition();
  return (
    <form
      className="card space-y-4"
      action={(fd) => start(() => action(fd))}
    >
      <Section title="Datos personales">
        <Field name="nombre" label="Nombre *" required defaultValue={initial?.nombre} />
        <Field name="nombre_fantasia" label="Nombre fantasía" defaultValue={initial?.nombreFantasia || ''} />
        <Field name="dni" label="DNI" defaultValue={initial?.dni || ''} />
        <Field name="cuit" label="CUIT" defaultValue={initial?.cuit || ''} />
        <Select
          name="tipo_responsable"
          label="Tipo responsable"
          defaultValue={initial?.tipoResponsable || 'Consumidor Final'}
          options={['Consumidor Final', 'Responsable Inscripto', 'Monotributo', 'Exento', 'Sujeto No Categorizado']}
        />
      </Section>

      <Section title="Contacto">
        <Field name="telefono" label="Teléfono" defaultValue={initial?.telefono || ''} />
        <Field name="telefono_alt" label="Teléfono alternativo" defaultValue={initial?.telefonoAlt || ''} />
        <Field name="email" label="Email" type="email" defaultValue={initial?.email || ''} />
        <Field name="email_alt" label="Email alternativo" type="email" defaultValue={initial?.emailAlt || ''} />
        <Field name="contacto" label="Persona contacto" defaultValue={initial?.contacto || ''} />
      </Section>

      <Section title="Domicilio">
        <Field name="domicilio" label="Domicilio" defaultValue={initial?.domicilio || ''} className="md:col-span-2" />
        <Field name="localidad" label="Localidad" defaultValue={initial?.localidad || ''} />
      </Section>

      <div>
        <label className="block text-sm mb-1 text-fma-white-soft/80">Comentario</label>
        <textarea
          name="comentario"
          defaultValue={initial?.comentario || ''}
          rows={3}
          className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-50">
          {isPending ? 'Guardando...' : initial?.id ? 'Actualizar' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-fma-cyan mb-2 uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field(props: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={props.className}>
      <label className="block text-sm mb-1 text-fma-white-soft/80">{props.label}</label>
      <input
        name={props.name}
        type={props.type || 'text'}
        required={props.required}
        defaultValue={props.defaultValue}
        className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
      />
    </div>
  );
}

function Select(props: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-fma-white-soft/80">{props.label}</label>
      <select
        name={props.name}
        defaultValue={props.defaultValue}
        className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
      >
        {props.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
