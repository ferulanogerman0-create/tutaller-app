import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2, Trophy } from 'lucide-react';
import { getCodigoDetail, marcarPremiado, deleteCodigo } from '@/lib/actions/referidos';
import { PREMIO_LABEL } from '@/lib/referidos-constants';
import { WaButton } from './wa-button';
import { getTelefonoNormalizado } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function CodigoDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const base = `/${slug}/dashboard`;
  const cid = Number(id);
  const data = await getCodigoDetail(cid);
  if (!data) notFound();
  const { codigo, cliente, referidos } = data;
  const n = referidos.length;
  const pct = Math.min(100, (n / 3) * 100);

  const markPremiado = marcarPremiado.bind(null, codigo.id);
  const deleteAction = deleteCodigo.bind(null, codigo.id);

  const linkPublico = `https://fma.wolfdma.website/r/${codigo.codigo}`;
  const waMsg = `¡Hola ${cliente.nombre}! 🔧\n\nGracias por confiar en *FMA Mecatrónica*.\n\nTu código de referidos: *${codigo.codigo}*\n🔗 Link para compartir: ${linkPublico}\n\n📲 Mandalo a amigos y familiares. Cuando 3 de ellos hagan un servicio con tu código, te ganás:\n🏆 *${PREMIO_LABEL[codigo.premioTipo]}*\n\n¡Gracias por recomendarnos!`;
  const waPremio = `¡Hola ${cliente.nombre}! 🎉\n\nTe escribimos desde FMA Mecatrónica para avisarte que completaste tus *3 referidos*.\n\n🏆 Tu premio: *${PREMIO_LABEL[codigo.premioTipo]}*\n\nPodés venir cuando quieras a reclamarlo. ¡Gracias por recomendarnos! 🔧`;
  const mensajeInicial = n >= 3 ? waPremio : waMsg;
  const telNormalizado = getTelefonoNormalizado(cliente.telefono || cliente.telefonoAlt);

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/referidos`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-fma-white mb-1">{cliente.nombre}</h1>
            <div className="text-fma-white-soft/60 text-sm">📱 {cliente.telefono || '—'} · DNI: {cliente.dni || '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-fma-white-soft/60 uppercase tracking-wider">Código</div>
            <div className="text-3xl font-mono font-bold text-fma-cyan tracking-widest">{codigo.codigo}</div>
          </div>
        </div>

        <div className="mb-2 flex justify-between text-sm text-fma-white-soft/80">
          <span>Progreso de referidos</span>
          <span className="font-bold">{n}/3</span>
        </div>
        <div className="h-3 bg-fma-black-3 rounded-full overflow-hidden mb-3">
          <div className={`h-full transition-all ${n >= 3 ? 'bg-green-400' : 'bg-fma-cyan'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2 mb-4">
          {[0,1,2].map(i => (
            <div key={i} className={`flex-1 h-12 rounded-md flex items-center justify-center font-bold text-lg ${
              i < n
                ? n >= 3 ? 'bg-green-500/20 border-2 border-green-500 text-green-300' : 'bg-fma-cyan/20 border-2 border-fma-cyan text-fma-cyan'
                : 'border-2 border-dashed border-fma-gray text-fma-white-soft/40'
            }`}>
              {i < n ? '✓' : i + 1}
            </div>
          ))}
        </div>

        <div className="text-sm text-fma-white-soft/60 mb-4">
          🎁 Premio asignado: <strong className="text-fma-cyan">{PREMIO_LABEL[codigo.premioTipo]}</strong>
        </div>

        <div className="bg-fma-black-3 border border-fma-gray rounded-md p-3 mb-4">
          <div className="text-xs text-fma-white-soft/60 mb-1">Link público para compartir</div>
          <div className="font-mono text-sm text-fma-cyan break-all">{linkPublico}</div>
          <div className="text-xs text-fma-white-soft/40 mt-1">El cliente abre el link y se auto-registra como referido</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <WaButton codigoId={codigo.id} telefono={telNormalizado} mensajeInicial={mensajeInicial} />
          {n >= 3 && !codigo.premiado && (
            <form action={markPremiado}>
              <button type="submit" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4" /> Marcar premiado
              </button>
            </form>
          )}
          <form action={deleteAction} className="ml-auto">
            <button type="submit" className="btn-secondary inline-flex items-center gap-1 text-sm text-red-400 border-red-500/50 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </form>
        </div>

        {n >= 3 && !codigo.premiado && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500 rounded-md text-green-300">
            🏆 ¡Premio listo para entregar! Avisale al cliente.
          </div>
        )}
        {codigo.premiado && (
          <div className="mt-4 p-4 bg-green-500/15 border border-green-500/50 rounded-md text-green-300 text-sm">
            ✅ Premio entregado el {codigo.premiadoAt?.toLocaleString('es-AR')}.
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-fma-white mb-4">Referidos ({n}/3)</h2>
        {referidos.length === 0 ? (
          <p className="text-fma-white-soft/40 text-sm">Aún no hay referidos. Cuando llegue alguien mencionando este código, registralo desde la página principal de Referidos.</p>
        ) : (
          <ul className="space-y-2">
            {referidos.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 p-3 bg-fma-black-3 rounded-md">
                <span className="text-fma-cyan font-bold">#{i + 1}</span>
                <div className="flex-1">
                  <div className="text-fma-white font-medium">{r.nombre}</div>
                  <div className="text-xs text-fma-white-soft/60">{r.servicio} {r.vehiculoDominio ? `· 🚗 ${r.vehiculoDominio}` : ''}</div>
                </div>
                <div className="text-xs text-fma-white-soft/40">{r.createdAt.toLocaleDateString('es-AR')}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
