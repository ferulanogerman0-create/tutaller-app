'use client';
import { useTransition } from 'react';

export function IvaBatchButton({ ordenId }: { ordenId: number }) {
  const [pending, start] = useTransition();
  const aplicar = (iva: number) => {
    if (!confirm(`¿Setear IVA = ${iva}% en TODOS los items de esta orden?`)) return;
    start(async () => {
      const r = await fetch('/api/admin/orden-set-iva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId, iva }),
      });
      if (r.ok) {
        location.reload();
      } else {
        const t = await r.text();
        alert('Error: ' + t.slice(0, 200));
      }
    });
  };
  return (
    <div className="flex gap-2 mb-3">
      <button type="button" onClick={() => aplicar(0)} disabled={pending}
        className="text-xs px-3 py-1 rounded bg-fma-black-3 hover:bg-fma-gray border border-fma-gray-light text-fma-white-soft disabled:opacity-40">
        {pending ? '...' : 'Setear IVA 0% (todos)'}
      </button>
      <button type="button" onClick={() => aplicar(21)} disabled={pending}
        className="text-xs px-3 py-1 rounded bg-fma-black-3 hover:bg-fma-gray border border-fma-gray-light text-fma-white-soft disabled:opacity-40">
        {pending ? '...' : 'Setear IVA 21% (todos)'}
      </button>
      <button type="button" onClick={() => aplicar(10.5)} disabled={pending}
        className="text-xs px-3 py-1 rounded bg-fma-black-3 hover:bg-fma-gray border border-fma-gray-light text-fma-white-soft disabled:opacity-40">
        {pending ? '...' : 'Setear IVA 10.5% (todos)'}
      </button>
    </div>
  );
}
