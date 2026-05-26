'use client';
import { useState, useEffect, useRef, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { addItem } from '@/lib/actions/ordenes';

type Sugerencia = { id: number; codigo: string | null; nombre: string; tipo: 'servicio' | 'repuesto'; precio: string; ivaPct: string };

export function AddItemForm({ ordenId }: { ordenId: number }) {
  const [q, setQ] = useState('');
  const [sugs, setSugs] = useState<Sugerencia[]>([]);
  const [showSugs, setShowSugs] = useState(false);
  const [form, setForm] = useState({
    nombre: '', tipo: 'servicio' as 'servicio' | 'repuesto',
    importe: '', cantidad: '1', bonificacion_pct: '0', iva_pct: '0',
    inventario_item_id: '',
  });
  const [pending, start] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) { setSugs([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/inventario/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setSugs(data.results || []);
    }, 200);
  }, [q]);

  const elegirSug = (s: Sugerencia) => {
    // IVA default 0 SIEMPRE — usuario decide si agregar 21 manualmente. NO copiar IVA del inventario.
    setForm({
      nombre: s.nombre,
      tipo: s.tipo,
      importe: s.precio,
      cantidad: '1',
      bonificacion_pct: '0',
      iva_pct: '0',
      inventario_item_id: String(s.id),
    });
    setQ(s.nombre);
    setShowSugs(false);
  };

  const submit = (fd: FormData) => {
    fd.set('nombre', form.nombre);
    fd.set('tipo', form.tipo);
    fd.set('importe', form.importe);
    fd.set('cantidad', form.cantidad);
    fd.set('bonificacion_pct', form.bonificacion_pct);
    fd.set('iva_pct', form.iva_pct);
    if (form.inventario_item_id) fd.set('inventario_item_id', form.inventario_item_id);
    start(async () => {
      await addItem(ordenId, fd);
      setForm({ nombre: '', tipo: 'servicio', importe: '', cantidad: '1', bonificacion_pct: '0', iva_pct: '0', inventario_item_id: '' });
      setQ('');
    });
  };

  return (
    <form action={submit} className="space-y-2">
      <div className="relative">
        <div className="flex items-center gap-2 bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-fma-white-soft/50" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setForm({ ...form, nombre: e.target.value, inventario_item_id: '' }); setShowSugs(true); }}
            onFocus={() => setShowSugs(true)}
            required
            placeholder="Buscar inventario o escribir item nuevo..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-fma-white"
          />
          {q && <button type="button" onClick={() => { setQ(''); setForm({ ...form, nombre: '' }); setSugs([]); }} className="text-fma-white-soft/40 hover:text-fma-white"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {showSugs && sugs.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-fma-black-2 border border-fma-gray rounded-md shadow-xl">
            {sugs.map((s) => (
              <button key={s.id} type="button" onClick={() => elegirSug(s)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-fma-black-3 border-b border-fma-gray last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-fma-white truncate">{s.nombre}</div>
                  <div className="text-xs text-fma-white-soft/50 truncate">{s.tipo}{s.codigo ? ` · ${s.codigo}` : ''}</div>
                </div>
                <div className="text-fma-cyan font-mono text-sm ml-2 flex-shrink-0">${Number(s.precio).toLocaleString('es-AR')}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'servicio' | 'repuesto' })}
          className="bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5 text-sm text-fma-white">
          <option value="servicio">Servicio</option>
          <option value="repuesto">Repuesto</option>
        </select>
        <input type="number" step="0.01" required placeholder="Importe" value={form.importe}
          onChange={(e) => setForm({ ...form, importe: e.target.value })}
          className="bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5 text-sm text-fma-white" />
        <input type="number" step="0.01" value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          className="bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5 text-sm text-fma-white" />
        <input type="number" step="0.01" placeholder="Bonif%" value={form.bonificacion_pct}
          onChange={(e) => setForm({ ...form, bonificacion_pct: e.target.value })}
          className="bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5 text-sm text-fma-white" />
        <select value={form.iva_pct} onChange={(e) => setForm({ ...form, iva_pct: e.target.value })}
          className="bg-fma-black-3 border border-fma-gray-light rounded-md px-2 py-1.5 text-sm text-fma-white">
          <option value="21">21%</option>
          <option value="10.5">10.5%</option>
          <option value="0">0%</option>
        </select>
        <button type="submit" disabled={pending || !form.nombre || !form.importe}
          className="btn-primary text-sm disabled:opacity-50">
          {pending ? '...' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}
