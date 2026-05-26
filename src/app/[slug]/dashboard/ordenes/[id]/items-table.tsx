'use client';
import { useState, useTransition } from 'react';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { updateItemInline, removeItem } from '@/lib/actions/ordenes';

type Item = {
  id: number;
  nombre: string;
  tipo: 'servicio' | 'repuesto';
  importe: string;
  cantidad: string;
  bonificacionPct: string;
  ivaPct: string;
  subtotal: string;
};

export function ItemsTable({ items, ordenId }: { items: Item[]; ordenId: number }) {
  if (items.length === 0) return <p className="text-fma-white-soft/40 mb-4">Sin items cargados.</p>;
  return (
    <table className="w-full text-sm mb-4">
      <thead className="text-xs uppercase text-fma-white-soft/60">
        <tr>
          <th className="text-left py-2">Item</th>
          <th className="text-left py-2 w-20">Tipo</th>
          <th className="text-right py-2 w-20">Cant</th>
          <th className="text-right py-2 w-28">Importe</th>
          <th className="text-right py-2 w-20">Bonif%</th>
          <th className="text-right py-2 w-16">IVA%</th>
          <th className="text-right py-2 w-28">Subtotal</th>
          <th className="w-20"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <ItemRow key={it.id} item={it} ordenId={ordenId} />
        ))}
      </tbody>
    </table>
  );
}

function ItemRow({ item, ordenId }: { item: Item; ordenId: number }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    nombre: item.nombre,
    tipo: item.tipo,
    cantidad: item.cantidad,
    importe: item.importe,
    bonificacionPct: item.bonificacionPct,
    ivaPct: item.ivaPct,
  });

  const guardar = () => {
    start(async () => {
      await updateItemInline(item.id, ordenId, {
        nombre: form.nombre,
        tipo: form.tipo,
        importe: Number(form.importe),
        cantidad: Number(form.cantidad),
        bonificacionPct: Number(form.bonificacionPct),
        ivaPct: Number(form.ivaPct),
      });
      setEditing(false);
    });
  };

  const eliminar = () => {
    if (!confirm(`¿Eliminar item "${item.nombre}"?`)) return;
    start(async () => { await removeItem(item.id, ordenId); });
  };

  if (!editing) {
    return (
      <tr className="border-t border-fma-gray hover:bg-fma-black-3">
        <td className="py-2">{item.nombre}</td>
        <td className="py-2 capitalize">{item.tipo}</td>
        <td className="py-2 text-right">{Number(item.cantidad)}</td>
        <td className="py-2 text-right">${Number(item.importe).toLocaleString('es-AR')}</td>
        <td className="py-2 text-right">{Number(item.bonificacionPct)}</td>
        <td className="py-2 text-right">{Number(item.ivaPct)}</td>
        <td className="py-2 text-right font-semibold">${Number(item.subtotal).toLocaleString('es-AR')}</td>
        <td className="py-2 text-right">
          <div className="flex gap-1 justify-end">
            <button type="button" onClick={() => setEditing(true)} className="p-1 text-fma-cyan hover:bg-fma-black-3 rounded" title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={eliminar} disabled={pending} className="p-1 text-red-400 hover:bg-fma-black-3 rounded disabled:opacity-40" title="Eliminar">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-fma-gray bg-fma-black-3">
      <td className="py-2 pr-2">
        <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-2 py-1 text-sm text-fma-white" />
      </td>
      <td className="py-2 pr-2">
        <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'servicio' | 'repuesto' })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-1 py-1 text-sm text-fma-white">
          <option value="servicio">Servicio</option>
          <option value="repuesto">Repuesto</option>
        </select>
      </td>
      <td className="py-2 pr-1">
        <input type="number" step="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-1 py-1 text-sm text-fma-white text-right" />
      </td>
      <td className="py-2 pr-1">
        <input type="number" step="0.01" value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-1 py-1 text-sm text-fma-white text-right" />
      </td>
      <td className="py-2 pr-1">
        <input type="number" step="0.01" value={form.bonificacionPct} onChange={(e) => setForm({ ...form, bonificacionPct: e.target.value })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-1 py-1 text-sm text-fma-white text-right" />
      </td>
      <td className="py-2 pr-1">
        <select value={String(Number(form.ivaPct))} onChange={(e) => setForm({ ...form, ivaPct: e.target.value })}
          className="w-full bg-fma-black-2 border border-fma-gray-light rounded px-1 py-1 text-sm text-fma-white">
          <option value="21">21</option>
          <option value="10.5">10.5</option>
          <option value="0">0</option>
        </select>
      </td>
      <td className="py-2 text-right text-fma-white-soft/50 text-xs">
        Recalc al guardar
      </td>
      <td className="py-2 text-right">
        <div className="flex gap-1 justify-end">
          <button type="button" onClick={guardar} disabled={pending} className="p-1 text-green-400 hover:bg-fma-gray rounded disabled:opacity-40" title="Guardar">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className="p-1 text-fma-white-soft hover:bg-fma-gray rounded" title="Cancelar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
