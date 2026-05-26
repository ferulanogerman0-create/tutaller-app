'use client';
import { useState, useTransition } from 'react';
import { Send, X } from 'lucide-react';

export function WaButton({ codigoId, telefono, mensajeInicial }: { codigoId: number; telefono: string | null; mensajeInicial: string }) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState(mensajeInicial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const enviar = () => {
    setResult(null);
    start(async () => {
      const r = await fetch(`/api/referidos/${codigoId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setResult({ ok: true, msg: 'Enviado' });
        setTimeout(() => { setOpen(false); setResult(null); }, 1500);
      } else {
        setResult({ ok: false, msg: data.error || `Error ${r.status}` });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!telefono}
        title={telefono ? 'Enviar por WhatsApp' : 'Cliente sin teléfono'}
        className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#25D366', color: 'white', borderColor: '#25D366' }}
      >
        <Send className="h-4 w-4" /> Enviar WhatsApp
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !pending && setOpen(false)}>
          <div className="bg-fma-black-2 border border-fma-gray rounded-lg p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-fma-white">Enviar por WhatsApp</h3>
              <button onClick={() => !pending && setOpen(false)} className="text-fma-white-soft/60 hover:text-fma-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm text-fma-white-soft/70 mb-3">
              A: <span className="font-mono text-fma-cyan">+{telefono}</span>
            </div>
            <textarea
              rows={10}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white text-sm font-mono"
            />
            {result && (
              <div className={`mt-3 p-2 rounded text-sm ${result.ok ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                {result.msg}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => !pending && setOpen(false)} className="btn-secondary text-sm">Cancelar</button>
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
