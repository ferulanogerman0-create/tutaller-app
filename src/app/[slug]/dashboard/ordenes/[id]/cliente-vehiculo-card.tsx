'use client';
import { useState, useTransition, useEffect, useRef } from 'react';
import { Pencil, RefreshCcw, Check, X, Search } from 'lucide-react';
import { setOrdenClienteVehiculo, updateClienteInline, updateVehiculoInline } from '@/lib/actions/ordenes';

type ClienteData = { id: number; nombre: string; dni: string | null; telefono: string | null; telefonoAlt: string | null; email: string | null; domicilio: string | null; localidad: string | null } | null;
type VehiculoData = { id: number; dominio: string; marca: string | null; modelo: string | null; anio: number | null; color: string | null; tipo: string | null; kilometraje: number | null; chasis: string | null } | null;

export function ClienteVehiculoCard({ ordenId, cliente, vehiculo }: {
  ordenId: number;
  cliente: ClienteData;
  vehiculo: VehiculoData;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-fma-gray">
      <ClienteCard ordenId={ordenId} cliente={cliente} currentVehiculoId={vehiculo?.id || null} />
      <VehiculoCard ordenId={ordenId} vehiculo={vehiculo} currentClienteId={cliente?.id || null} />
    </div>
  );
}

function ClienteCard({ ordenId, cliente, currentVehiculoId }: { ordenId: number; cliente: ClienteData; currentVehiculoId: number | null }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'change'>('view');
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    nombre: cliente?.nombre || '', dni: cliente?.dni || '', telefono: cliente?.telefono || '',
    telefonoAlt: cliente?.telefonoAlt || '', email: cliente?.email || '', domicilio: cliente?.domicilio || '', localidad: cliente?.localidad || '',
  });

  const guardar = () => {
    if (!cliente) return;
    start(async () => {
      await updateClienteInline(cliente.id, form, ordenId);
      setMode('view');
    });
  };

  return (
    <div className="bg-fma-black-3 rounded-md p-3 border border-fma-gray">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase text-fma-cyan font-bold">Cliente</div>
        <div className="flex gap-1">
          {mode === 'view' && cliente && (
            <button type="button" onClick={() => setMode('edit')} className="text-xs text-fma-white-soft/60 hover:text-fma-cyan flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Editar datos
            </button>
          )}
          <button type="button" onClick={() => setMode('change')} className="text-xs text-fma-white-soft/60 hover:text-fma-cyan flex items-center gap-1 ml-2">
            <RefreshCcw className="h-3 w-3" /> Cambiar
          </button>
        </div>
      </div>

      {mode === 'view' && (
        <div>
          <div className="text-fma-white font-semibold">{cliente?.nombre || '—'}</div>
          <div className="text-xs text-fma-white-soft/60 space-y-0.5 mt-1">
            <div>DNI: {cliente?.dni || '—'}</div>
            <div>Tel: {cliente?.telefono || '—'}{cliente?.telefonoAlt ? ` · ${cliente.telefonoAlt}` : ''}</div>
            <div>Email: {cliente?.email || '—'}</div>
            <div>{cliente?.domicilio || ''}{cliente?.localidad ? ` · ${cliente.localidad}` : ''}</div>
          </div>
        </div>
      )}

      {mode === 'edit' && cliente && (
        <div className="space-y-1.5">
          <FieldRow label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
          <FieldRow label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} />
          <FieldRow label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
          <FieldRow label="Tel. alt." value={form.telefonoAlt} onChange={(v) => setForm({ ...form, telefonoAlt: v })} />
          <FieldRow label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <FieldRow label="Domicilio" value={form.domicilio} onChange={(v) => setForm({ ...form, domicilio: v })} />
          <FieldRow label="Localidad" value={form.localidad} onChange={(v) => setForm({ ...form, localidad: v })} />
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setMode('view')} className="text-xs px-2 py-1 bg-fma-gray rounded text-fma-white"><X className="h-3 w-3 inline" /> Cancelar</button>
            <button type="button" onClick={guardar} disabled={pending} className="text-xs px-2 py-1 bg-fma-cyan text-fma-black rounded font-semibold disabled:opacity-50">
              <Check className="h-3 w-3 inline" /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {mode === 'change' && (
        <SearchCliente
          onSelect={(c, vehSugerido) => {
            start(async () => {
              await setOrdenClienteVehiculo(ordenId, c.id, vehSugerido?.id ?? currentVehiculoId);
              setMode('view');
            });
          }}
          onCancel={() => setMode('view')}
        />
      )}
    </div>
  );
}

function VehiculoCard({ ordenId, vehiculo, currentClienteId }: { ordenId: number; vehiculo: VehiculoData; currentClienteId: number | null }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'change'>('view');
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    dominio: vehiculo?.dominio || '', marca: vehiculo?.marca || '', modelo: vehiculo?.modelo || '',
    anio: vehiculo?.anio?.toString() || '', color: vehiculo?.color || '', tipo: vehiculo?.tipo || '',
    kilometraje: vehiculo?.kilometraje?.toString() || '', chasis: vehiculo?.chasis || '',
  });

  const guardar = () => {
    if (!vehiculo) return;
    start(async () => {
      await updateVehiculoInline(vehiculo.id, {
        dominio: form.dominio, marca: form.marca, modelo: form.modelo,
        anio: form.anio ? Number(form.anio) : null, color: form.color, tipo: form.tipo,
        kilometraje: form.kilometraje ? Number(form.kilometraje) : null, chasis: form.chasis,
      }, ordenId);
      setMode('view');
    });
  };

  return (
    <div className="bg-fma-black-3 rounded-md p-3 border border-fma-gray">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase text-fma-cyan font-bold">Vehículo</div>
        <div className="flex gap-1">
          {mode === 'view' && vehiculo && (
            <button type="button" onClick={() => setMode('edit')} className="text-xs text-fma-white-soft/60 hover:text-fma-cyan flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Editar datos
            </button>
          )}
          <button type="button" onClick={() => setMode('change')} className="text-xs text-fma-white-soft/60 hover:text-fma-cyan flex items-center gap-1 ml-2">
            <RefreshCcw className="h-3 w-3" /> Cambiar
          </button>
        </div>
      </div>

      {mode === 'view' && (
        <div>
          <div className="text-fma-white font-semibold">{vehiculo?.marca} {vehiculo?.modelo}</div>
          <div className="text-xs text-fma-white-soft/60 space-y-0.5 mt-1">
            <div>Dominio: <span className="font-mono text-fma-cyan">{vehiculo?.dominio || '—'}</span></div>
            <div>Año: {vehiculo?.anio || '—'} · Color: {vehiculo?.color || '—'}</div>
            <div>Tipo: {vehiculo?.tipo || '—'} · KM: {vehiculo?.kilometraje || '—'}</div>
            <div>Chasis: {vehiculo?.chasis || '—'}</div>
          </div>
        </div>
      )}

      {mode === 'edit' && vehiculo && (
        <div className="space-y-1.5">
          <FieldRow label="Dominio" value={form.dominio} onChange={(v) => setForm({ ...form, dominio: v.toUpperCase() })} />
          <FieldRow label="Marca" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
          <FieldRow label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} />
          <FieldRow label="Año" value={form.anio} onChange={(v) => setForm({ ...form, anio: v })} />
          <FieldRow label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
          <FieldRow label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
          <FieldRow label="Kilometraje" value={form.kilometraje} onChange={(v) => setForm({ ...form, kilometraje: v })} />
          <FieldRow label="Chasis" value={form.chasis} onChange={(v) => setForm({ ...form, chasis: v })} />
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setMode('view')} className="text-xs px-2 py-1 bg-fma-gray rounded text-fma-white"><X className="h-3 w-3 inline" /> Cancelar</button>
            <button type="button" onClick={guardar} disabled={pending} className="text-xs px-2 py-1 bg-fma-cyan text-fma-black rounded font-semibold disabled:opacity-50">
              <Check className="h-3 w-3 inline" /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {mode === 'change' && (
        <SearchVehiculo
          onSelect={(v) => {
            start(async () => {
              await setOrdenClienteVehiculo(ordenId, v.clienteId ?? currentClienteId, v.id);
              setMode('view');
            });
          }}
          onCancel={() => setMode('view')}
        />
      )}
    </div>
  );
}

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-fma-white-soft/60 w-24 flex-shrink-0">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-fma-black-2 border border-fma-gray rounded px-2 py-1 text-sm text-fma-white" />
    </div>
  );
}

type ClienteSearchResult = { id: number; nombre: string; dni: string | null; telefono: string | null };
type VehiculoSugerido = { id: number; dominio: string; marca: string | null; modelo: string | null };

function SearchCliente({ onSelect, onCancel }: { onSelect: (c: ClienteSearchResult, vehSugerido: VehiculoSugerido | null) => void; onCancel: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ClienteSearchResult[]>([]);
  const [vehs, setVehs] = useState<VehiculoSugerido[]>([]);
  const [selected, setSelected] = useState<ClienteSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/clientes/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data.results || []);
    }, 250);
  }, [q]);

  const elegir = async (c: ClienteSearchResult) => {
    setSelected(c);
    const r = await fetch(`/api/clientes/${c.id}/vehiculos`);
    const data = await r.json();
    setVehs(data.results || []);
    if (data.results?.length === 1) {
      // auto-confirma si solo tiene 1 vehículo
      onSelect(c, data.results[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-fma-white-soft/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Buscar por nombre, DNI o tel..."
          className="flex-1 bg-fma-black-2 border border-fma-gray rounded px-2 py-1.5 text-sm text-fma-white" />
        <button type="button" onClick={onCancel} className="text-fma-white-soft/60 hover:text-red-400"><X className="h-4 w-4" /></button>
      </div>
      {!selected && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {results.map((c) => (
            <button key={c.id} onClick={() => elegir(c)}
              className="w-full text-left bg-fma-black-2 hover:bg-fma-gray rounded px-2 py-1.5 text-sm">
              <div className="text-fma-white">{c.nombre}</div>
              <div className="text-xs text-fma-white-soft/50">DNI: {c.dni || '—'} · {c.telefono || '—'}</div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div>
          <div className="text-xs text-fma-white-soft/60 mb-1">Cliente: <span className="text-fma-white">{selected.nombre}</span></div>
          <div className="text-xs text-fma-white-soft/60 mb-1">Elegir vehículo:</div>
          {vehs.length === 0 && <div className="text-xs text-yellow-300">Cliente sin vehículos asociados. El vehículo actual se mantiene.</div>}
          <div className="space-y-1 mt-1">
            {vehs.map((v) => (
              <button key={v.id} onClick={() => onSelect(selected, v)}
                className="w-full text-left bg-fma-black-2 hover:bg-fma-cyan/20 rounded px-2 py-1.5 text-sm">
                <span className="font-mono text-fma-cyan">{v.dominio}</span> · {v.marca} {v.modelo}
              </button>
            ))}
            <button type="button" onClick={() => onSelect(selected, null)}
              className="w-full text-left bg-fma-black-2 hover:bg-fma-gray rounded px-2 py-1 text-xs text-fma-white-soft/60">
              Mantener vehículo actual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type VehiculoSearchResult = { id: number; dominio: string; marca: string | null; modelo: string | null; clienteId: number | null };

function SearchVehiculo({ onSelect, onCancel }: { onSelect: (v: VehiculoSearchResult) => void; onCancel: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<VehiculoSearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/vehiculos/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data.results || []);
    }, 250);
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-fma-white-soft/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Buscar por dominio, marca, modelo..."
          className="flex-1 bg-fma-black-2 border border-fma-gray rounded px-2 py-1.5 text-sm text-fma-white" />
        <button type="button" onClick={onCancel} className="text-fma-white-soft/60 hover:text-red-400"><X className="h-4 w-4" /></button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {results.map((v) => (
            <button key={v.id} onClick={() => onSelect(v)}
              className="w-full text-left bg-fma-black-2 hover:bg-fma-gray rounded px-2 py-1.5 text-sm">
              <span className="font-mono text-fma-cyan">{v.dominio}</span> · {v.marca} {v.modelo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
