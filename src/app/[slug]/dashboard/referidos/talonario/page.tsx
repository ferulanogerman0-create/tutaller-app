'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'next/navigation';

const PREMIO_MAP = {
  aceite: 'Cambio de aceite y filtro gratis 🛢️',
  descuento: '40% de descuento en próxima reparación 🔧',
  ambos: 'Cambio de aceite gratis 🛢️ o 40% descuento 🔧 (a elección)',
};

export default function TalonarioPage() {
  const { slug } = useParams<{ slug: string }>();
  const base = `/${slug}/dashboard`;
  const [nombre, setNombre] = useState('FMA MECATRÓNICA');
  const [sub, setSub] = useState('Mecánica de Avanzada');
  const [premio, setPremio] = useState<keyof typeof PREMIO_MAP>('aceite');
  const [codigo, setCodigo] = useState('REF-0001');

  const imprimir = () => {
    const tarjetaHTML = document.getElementById('tarjeta-preview')?.outerHTML || '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Talonario FMA</title>
      <style>
        body { background: #fff; margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
        .page { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 700px; margin: 0 auto; }
        .tarjeta { width: 100%; background: #0A0A0A; border: 2px solid #00B4D8; border-radius: 10px; overflow: hidden; break-inside: avoid; color: #f5f5f5; }
        .t-head { background: #00B4D8; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
        .t-nombre { font-size: 22px; font-weight: 900; color: #0A0A0A; letter-spacing: 2px; line-height: 1; }
        .t-sub { font-size: 10px; letter-spacing: 2px; color: rgba(0,0,0,.65); }
        .t-body { padding: 16px 18px; }
        .t-titulo { font-size: 16px; font-weight: 800; color: #00B4D8; margin-bottom: 6px; letter-spacing: 1.5px; }
        .t-desc { font-size: 11px; color: #aaa; line-height: 1.5; margin-bottom: 14px; }
        .t-cod { background: #1a1a1a; border: 1px dashed #333; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
        .t-cod-label { font-size: 10px; letter-spacing: 2px; color: #999; margin-bottom: 4px; text-transform: uppercase; }
        .t-cod-val { font-size: 26px; letter-spacing: 4px; color: #00B4D8; font-weight: 900; }
        .t-checks { display: flex; gap: 6px; margin-bottom: 14px; }
        .t-ch { flex: 1; border: 1.5px dashed #444; border-radius: 4px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #555; }
        .t-premio { font-size: 11px; color: #999; border-top: 1px solid #333; padding-top: 10px; line-height: 1.5; }
        .t-premio strong { color: #00B4D8; }
        .t-foot { background: #1a1a1a; padding: 10px 18px; border-top: 1px solid #333; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
        @media print { @page { margin: 10mm; } body { padding: 0; } }
      </style></head><body>
      <div class="page">${tarjetaHTML.repeat(6)}</div>
      <script>setTimeout(() => window.print(), 500);</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="p-8 max-w-5xl">
      <Link href={`${base}/referidos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-6">🎫 Talonario tarjetas</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview */}
        <div>
          <h3 className="text-fma-cyan uppercase text-xs tracking-wide font-bold mb-3">Vista previa</h3>
          <div id="tarjeta-preview" className="tarjeta" style={{ background: '#0A0A0A', border: '2px solid #00B4D8', borderRadius: 10, overflow: 'hidden', color: '#f5f5f5' }}>
            <div className="t-head" style={{ background: '#00B4D8', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="t-nombre" style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A', letterSpacing: 2, lineHeight: 1 }}>{nombre.toUpperCase()}</div>
                <div className="t-sub" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(0,0,0,.65)' }}>{sub}</div>
              </div>
              <div style={{ fontSize: 28 }}>🔧</div>
            </div>
            <div className="t-body" style={{ padding: '16px 18px' }}>
              <div className="t-titulo" style={{ fontSize: 16, fontWeight: 800, color: '#00B4D8', marginBottom: 6, letterSpacing: 1.5 }}>🎁 PROGRAMA DE REFERIDOS</div>
              <div className="t-desc" style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5, marginBottom: 14 }}>
                Recomendá nuestro taller a <strong style={{ color: '#f5f5f5' }}>3 amigos</strong> que realicen un servicio y ganás tu premio.
              </div>
              <div className="t-cod" style={{ background: '#1a1a1a', border: '1px dashed #333', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
                <div className="t-cod-label" style={{ fontSize: 10, letterSpacing: 2, color: '#999', marginBottom: 4, textTransform: 'uppercase' }}>Tu código único</div>
                <div className="t-cod-val" style={{ fontSize: 26, letterSpacing: 4, color: '#00B4D8', fontWeight: 900 }}>{codigo}</div>
              </div>
              <div className="t-checks" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="t-ch" style={{ flex: 1, border: '1.5px dashed #444', borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#555' }}>✦ REF {i}</div>
                ))}
              </div>
              <div className="t-premio" style={{ fontSize: 11, color: '#999', borderTop: '1px solid #333', paddingTop: 10, lineHeight: 1.5 }}>
                Al completar 3 referidos recibís: <strong style={{ color: '#00B4D8' }}>{PREMIO_MAP[premio]}</strong><br />
                Cada amigo debe mencionar tu código al pagar.
              </div>
            </div>
            <div className="t-foot" style={{ background: '#1a1a1a', padding: '10px 18px', borderTop: '1px solid #333', fontSize: 10, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ameghino 1216, Campana</span>
              <span>wa.me/3489681980</span>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="card">
          <h3 className="text-fma-cyan uppercase text-xs tracking-wide font-bold mb-3">Personalizar</h3>
          <div className="space-y-3">
            <Field label="Nombre taller" value={nombre} onChange={setNombre} />
            <Field label="Subtítulo" value={sub} onChange={setSub} />
            <div>
              <label className="block text-sm mb-1 text-fma-white-soft/80">Premio</label>
              <select value={premio} onChange={(e) => setPremio(e.target.value as keyof typeof PREMIO_MAP)} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan">
                <option value="aceite">🛢️ Cambio de aceite y filtro gratis</option>
                <option value="descuento">🔧 40% descuento próxima reparación</option>
                <option value="ambos">🎁 A elección del cliente</option>
              </select>
            </div>
            <Field label="Código preview" value={codigo} onChange={(v) => setCodigo(v.toUpperCase())} />
          </div>
          <button onClick={imprimir} className="btn-primary w-full mt-4">🖨️ Imprimir hoja A4 (6 tarjetas)</button>
          <p className="text-xs text-fma-white-soft/40 mt-3 leading-relaxed">
            💡 Imprimí varias tarjetas en una hoja A4, recortalas y entregalas con cada servicio. Sirven como publicidad porque los clientes las comparten.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-fma-white-soft/80">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan" />
    </div>
  );
}
