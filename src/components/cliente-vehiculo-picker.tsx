'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, User, Car, Check } from 'lucide-react';

type Cliente = { id: number; nombre: string; dni?: string | null; telefono?: string | null };
type Vehiculo = { id: number; dominio: string; marca: string | null; modelo: string | null; clienteId?: number | null };

export function ClienteVehiculoPicker({ clienteName = 'cliente_id', vehiculoName = 'vehiculo_id' }: { clienteName?: string; vehiculoName?: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [vehiculosCliente, setVehiculosCliente] = useState<Vehiculo[]>([]);

  // Cuando se elige cliente: traer sus vehículos para mostrar al tope
  useEffect(() => {
    if (!cliente) { setVehiculosCliente([]); return; }
    fetch(`/api/clientes/${cliente.id}/vehiculos`)
      .then(r => r.json())
      .then(d => setVehiculosCliente(d.results || []));
  }, [cliente]);

  // Cuando se elige vehículo: si tiene cliente asociado y no hay cliente seleccionado, auto-asignar
  useEffect(() => {
    if (!vehiculo || cliente) return;
    if (vehiculo.clienteId) {
      fetch(`/api/vehiculos/${vehiculo.id}/cliente`)
        .then(r => r.json())
        .then(d => { if (d.cliente) setCliente(d.cliente); });
    }
  }, [vehiculo, cliente]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input type="hidden" name={clienteName} value={cliente?.id || ''} />
      <input type="hidden" name={vehiculoName} value={vehiculo?.id || ''} />

      <div>
        <label className="block text-sm mb-1 text-fma-white-soft/80">Cliente</label>
        <ClienteSearch selected={cliente} onSelect={setCliente} />
      </div>
      <div>
        <label className="block text-sm mb-1 text-fma-white-soft/80">Vehículo</label>
        <VehiculoSearch selected={vehiculo} onSelect={setVehiculo} prioritarios={vehiculosCliente} />
      </div>
    </div>
  );
}

function ClienteSearch({ selected, onSelect }: { selected: Cliente | null; onSelect: (c: Cliente | null) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/clientes/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d.results || []);
    }, 200);
  }, [q]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-fma-cyan/10 border border-fma-cyan rounded-md px-3 py-2">
        <Check className="h-4 w-4 text-fma-cyan flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-fma-white truncate">{selected.nombre}</div>
          <div className="text-xs text-fma-white-soft/60 truncate">{selected.dni || ''} · {selected.telefono || ''}</div>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-fma-white-soft/60 hover:text-red-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2">
        <Search className="h-4 w-4 text-fma-white-soft/50" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar cliente por nombre, DNI o tel..."
          className="flex-1 bg-transparent border-0 outline-none text-fma-white text-sm" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-fma-black-2 border border-fma-gray rounded-md shadow-xl">
          {results.map((c) => (
            <button type="button" key={c.id} onClick={() => { onSelect(c); setQ(''); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-fma-black-3 border-b border-fma-gray last:border-0">
              <User className="h-3.5 w-3.5 text-fma-cyan flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-fma-white truncate">{c.nombre}</div>
                <div className="text-xs text-fma-white-soft/50 truncate">{c.dni || '—'} · {c.telefono || '—'}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VehiculoSearch({ selected, onSelect, prioritarios }: { selected: Vehiculo | null; onSelect: (v: Vehiculo | null) => void; prioritarios: Vehiculo[] }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Vehiculo[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/vehiculos/search?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d.results || []);
    }, 200);
  }, [q]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-fma-cyan/10 border border-fma-cyan rounded-md px-3 py-2">
        <Check className="h-4 w-4 text-fma-cyan flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-fma-white truncate">{selected.dominio}</div>
          <div className="text-xs text-fma-white-soft/60 truncate">{selected.marca} {selected.modelo}</div>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-fma-white-soft/60 hover:text-red-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Combinar: prioritarios primero, luego resultados sin duplicar
  const idsPrior = new Set(prioritarios.map(v => v.id));
  const combined = [
    ...prioritarios,
    ...results.filter(r => !idsPrior.has(r.id)),
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2">
        <Search className="h-4 w-4 text-fma-white-soft/50" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar vehículo por dominio, marca, modelo..."
          className="flex-1 bg-transparent border-0 outline-none text-fma-white text-sm" />
      </div>
      {open && combined.length > 0 && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-fma-black-2 border border-fma-gray rounded-md shadow-xl">
          {prioritarios.length > 0 && (
            <div className="px-3 py-1 text-[10px] uppercase text-fma-cyan bg-fma-cyan/10">Del cliente seleccionado</div>
          )}
          {combined.map((v, i) => {
            const esPrior = i < prioritarios.length;
            return (
              <button type="button" key={v.id} onClick={() => { onSelect(v); setQ(''); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-fma-black-3 border-b border-fma-gray last:border-0 ${esPrior ? 'bg-fma-cyan/5' : ''}`}>
                <Car className="h-3.5 w-3.5 text-fma-cyan flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-fma-white truncate">{v.dominio}</div>
                  <div className="text-xs text-fma-white-soft/50 truncate">{v.marca} {v.modelo}</div>
                </div>
              </button>
            );
          })}
          {prioritarios.length > 0 && q.length < 2 && (
            <div className="px-3 py-2 text-[10px] text-fma-white-soft/40 border-t border-fma-gray">Escribí para buscar otros vehículos…</div>
          )}
        </div>
      )}
    </div>
  );
}
