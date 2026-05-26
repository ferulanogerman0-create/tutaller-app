'use client';
import { useState, useTransition } from 'react';
import { Pencil, Check, X, Plus, Minus, Trash2 } from 'lucide-react';
import { updateInventarioItem, ajustarStock, deleteInventarioItem } from '@/lib/actions/inventario';

type Item = {
  id: number;
  codigo: string | null;
  nombre: string;
  tipo: 'servicio' | 'repuesto';
  precio: string;
  categoria: string | null;
  stock: number | null;
  stockMinimo: number | null;
};

export function StockRow({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const stockBajo = item.stock !== null && item.stockMinimo !== null && item.stock <= item.stockMinimo;

  const ajustar = (d: number) => start(async () => { await ajustarStock(item.id, d); });
  const eliminar = () => {
    if (!confirm(`¿Desactivar "${item.nombre}"?`)) return;
    start(async () => { await deleteInventarioItem(item.id); });
  };

  if (editing) {
    return (
      <tr className="border-t border-fma-gray bg-fma-black-3">
        <td colSpan={6} className="p-2">
          <form action={async (fd) => { await updateInventarioItem(item.id, fd); setEditing(false); }} className="grid grid-cols-7 gap-1 items-end">
            <input name="codigo" defaultValue={item.codigo || ''} placeholder="Código" className="bg-fma-black-2 border border-fma-gray rounded px-1.5 py-1 text-xs text-fma-white" />
            <input name="nombre" defaultValue={item.nombre} required placeholder="Nombre" className="col-span-2 bg-fma-black-2 border border-fma-gray rounded px-1.5 py-1 text-xs text-fma-white" />
            <input name="precio" type="number" step="0.01" defaultValue={item.precio} className="bg-fma-black-2 border border-fma-gray rounded px-1.5 py-1 text-xs text-fma-white" />
            <input name="stock" type="number" defaultValue={item.stock ?? ''} placeholder="Stock" className="bg-fma-black-2 border border-fma-gray rounded px-1.5 py-1 text-xs text-fma-white" />
            <input name="stock_minimo" type="number" defaultValue={item.stockMinimo ?? 0} placeholder="Mín" className="bg-fma-black-2 border border-fma-gray rounded px-1.5 py-1 text-xs text-fma-white" />
            <input name="tipo" type="hidden" value={item.tipo} />
            <input name="categoria" type="hidden" value={item.categoria || ''} />
            <div className="flex gap-1">
              <button type="submit" disabled={pending} className="p-1 bg-green-600/40 rounded"><Check className="h-3 w-3" /></button>
              <button type="button" onClick={() => setEditing(false)} className="p-1 bg-fma-gray rounded"><X className="h-3 w-3" /></button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-t border-fma-gray hover:bg-fma-black-3 ${stockBajo ? 'bg-red-500/5' : ''}`}>
      <td className="px-3 py-1.5 text-xs text-fma-white-soft/60 font-mono">{item.codigo || '—'}</td>
      <td className="px-3 py-1.5 text-fma-white text-sm">{item.nombre}</td>
      <td className="px-3 py-1.5 text-right text-fma-cyan font-semibold">${Number(item.precio).toLocaleString('es-AR')}</td>
      <td className="px-3 py-1.5 text-center">
        {item.stock !== null ? (
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => ajustar(-1)} disabled={pending} className="p-0.5 text-red-400 hover:bg-red-500/20 rounded"><Minus className="h-3 w-3" /></button>
            <span className={`font-mono font-bold ${stockBajo ? 'text-red-400' : 'text-fma-white'}`}>{item.stock}</span>
            <button onClick={() => ajustar(1)} disabled={pending} className="p-0.5 text-green-400 hover:bg-green-500/20 rounded"><Plus className="h-3 w-3" /></button>
          </div>
        ) : <span className="text-fma-white-soft/40">—</span>}
      </td>
      <td className="px-3 py-1.5 text-center text-xs text-fma-white-soft/60">{item.stockMinimo || '—'}</td>
      <td className="px-3 py-1.5 text-right">
        <div className="flex gap-1 justify-end">
          <button onClick={() => setEditing(true)} className="p-1 text-fma-cyan hover:bg-fma-black-3 rounded"><Pencil className="h-3 w-3" /></button>
          <button onClick={eliminar} className="p-1 text-red-400 hover:bg-fma-black-3 rounded"><Trash2 className="h-3 w-3" /></button>
        </div>
      </td>
    </tr>
  );
}
