'use client';
import { useState, useTransition } from 'react';
import { FileDown, Send, X, Trash2 } from 'lucide-react';
import { deleteOrden } from '@/lib/actions/ordenes';

export function OrdenActions({ ordenId, clienteNombre, telefono, comprobante, total, totalNeto, vehiculoLabel }: {
  ordenId: number;
  clienteNombre: string;
  telefono: string | null;
  comprobante: string;
  total: number;
  totalNeto: number;
  vehiculoLabel: string;
}) {
  const [showWa, setShowWa] = useState(false);
  const [mensaje, setMensaje] = useState(
    `Hola ${clienteNombre?.split(' ')[0] || ''}, tu comprobante ${comprobante} de FMA Mecatrónica.

Vehículo: ${vehiculoLabel}
Total: $${Number(total).toLocaleString('es-AR')}

💵 Pagando en efectivo te queda: $${Number(totalNeto).toLocaleString('es-AR')}
💳 Tenemos 6 cuotas sin interés con tarjetas Banco Provincia

Adjuntamos el PDF. Cualquier consulta respondé este mensaje. ¡Gracias!`,
  );
  const [pending, start] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  const enviar = () => {
    setResultado(null);
    start(async () => {
      const r = await fetch(`/api/ordenes/${ordenId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setResultado({ ok: true, msg: `Enviado vía ${data.via}` });
        setTimeout(() => { setShowWa(false); setResultado(null); }, 1500);
      } else {
        setResultado({ ok: false, msg: data.error || `Error ${r.status}` });
      }
    });
  };

  const confirmarEliminar = () => {
    if (confirm(`¿Eliminar orden ${comprobante}? Esta acción no se puede deshacer.`)) {
      start(async () => { await deleteOrden(ordenId); });
    }
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <a href={`/api/ordenes/${ordenId}/pdf`} target="_blank" rel="noopener" className="btn-secondary inline-flex items-center gap-2 text-sm">
          <FileDown className="h-4 w-4" /> PDF
        </a>
        <button
          onClick={() => setShowWa(true)}
          disabled={!telefono}
          title={telefono ? 'Enviar comprobante por WhatsApp' : 'Cliente sin teléfono'}
          className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" /> Enviar WhatsApp
        </button>
        <button
          onClick={confirmarEliminar}
          disabled={pending}
          title="Eliminar orden"
          className="inline-flex items-center gap-2 text-sm bg-red-600/20 text-red-300 border border-red-600/40 px-4 py-2 rounded-md hover:bg-red-600/40 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
      </div>

      {showWa && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !pending && setShowWa(false)}>
          <div className="bg-fma-black-2 border border-fma-gray rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-fma-white">Enviar por WhatsApp</h3>
              <button onClick={() => !pending && setShowWa(false)} className="text-fma-white-soft/60 hover:text-fma-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm text-fma-white-soft/70 mb-3">
              A: <span className="font-mono text-fma-cyan">+{telefono}</span> · {clienteNombre}
            </div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Mensaje</label>
            <textarea
              rows={7}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white text-sm font-mono"
            />
            <div className="text-xs text-fma-white-soft/40 mt-1">PDF se adjunta automáticamente.</div>
            {resultado && (
              <div className={`mt-3 p-2 rounded text-sm ${resultado.ok ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                {resultado.msg}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => !pending && setShowWa(false)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={enviar} disabled={pending} className="btn-primary text-sm disabled:opacity-60">
                {pending ? 'Enviando…' : 'Enviar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
