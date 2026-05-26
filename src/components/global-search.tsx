'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, Car, FileText } from 'lucide-react';

type Result = { type: 'cliente' | 'vehiculo' | 'orden'; id: number; label: string; sub: string; href: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data.results || []);
      setSelected(0);
    }, 200);
  }, [q]);

  const navigate = (r: Result) => {
    router.push(r.href);
    setOpen(false);
    setQ('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected]);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-fma-black-3 text-fma-white-soft/70 hover:bg-fma-gray border border-fma-gray rounded-md transition-colors w-full"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <span className="ml-auto text-fma-white-soft/40 font-mono">Ctrl+K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="bg-fma-black-2 border border-fma-gray rounded-lg w-full max-w-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-fma-gray">
          <Search className="h-4 w-4 text-fma-white-soft/50" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar clientes, vehículos, órdenes..."
            className="flex-1 bg-transparent border-0 outline-none text-fma-white"
          />
          <button onClick={() => setOpen(false)} className="text-fma-white-soft/50 hover:text-fma-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {q.length < 2 && <div className="px-4 py-8 text-center text-sm text-fma-white-soft/40">Escribí al menos 2 caracteres</div>}
          {q.length >= 2 && results.length === 0 && <div className="px-4 py-8 text-center text-sm text-fma-white-soft/40">Sin resultados</div>}
          {results.map((r, i) => {
            const Icon = r.type === 'cliente' ? User : r.type === 'vehiculo' ? Car : FileText;
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => navigate(r)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left ${selected === i ? 'bg-fma-cyan/20' : 'hover:bg-fma-black-3'}`}
              >
                <Icon className="h-4 w-4 text-fma-cyan flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-fma-white truncate">{r.label}</div>
                  <div className="text-xs text-fma-white-soft/50 truncate">{r.sub}</div>
                </div>
                <span className="text-[10px] text-fma-white-soft/40 uppercase">{r.type}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
