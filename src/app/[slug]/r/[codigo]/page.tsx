import { notFound } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, count } from 'drizzle-orm';
import { PREMIO_LABEL } from '@/lib/referidos-constants';
import { FmaLogo } from '@/components/fma-logo';
import { registrarReferidoPublico } from './action';

export const dynamic = 'force-dynamic';

export default async function ReferidoLandingPage({ params, searchParams }: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { codigo: codigoRaw } = await params;
  const sp = await searchParams;
  const codigo = codigoRaw.toUpperCase();

  const [codigoRow] = await db.select({
    codigo: schema.referidosCodigos,
    cliente: schema.clientes,
  })
    .from(schema.referidosCodigos)
    .innerJoin(schema.clientes, eq(schema.referidosCodigos.clienteId, schema.clientes.id))
    .where(eq(schema.referidosCodigos.codigo, codigo))
    .limit(1);

  if (!codigoRow) notFound();
  const { codigo: c, cliente } = codigoRow;
  const [{ c: refCount }] = await db.select({ c: count() })
    .from(schema.referidos).where(eq(schema.referidos.codigoId, c.id));

  const completo = refCount >= 3;
  const nombreRef = cliente.nombre.split(' ')[0];

  return (
    <div className="min-h-screen bg-fma-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <FmaLogo className="h-10 w-10" />
          <div>
            <div className="font-bold text-fma-white text-xl">FMA Mecatrónica</div>
            <div className="text-xs text-fma-white-soft/50">Campana · Buenos Aires</div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="text-center mb-4">
            <div className="text-xs uppercase text-fma-white-soft/50 tracking-wide">Código de</div>
            <div className="text-2xl font-bold text-fma-white">{cliente.nombre}</div>
            <div className="text-3xl font-mono font-bold text-fma-cyan tracking-widest mt-1">{c.codigo}</div>
          </div>
          <div className="text-center text-sm text-fma-white-soft/80 mb-2">
            Te recomendaron <strong className="text-fma-cyan">FMA Mecatrónica</strong> 👇
          </div>
          <div className="text-center text-xs text-fma-white-soft/60">
            Si hacés tu servicio con nosotros mencionando este código,<br />
            <strong className="text-fma-white">{nombreRef}</strong> suma 1 referido (3 = premio 🏆)
          </div>
        </div>

        {sp.ok && (
          <div className="card mb-4 border-green-500/40">
            <div className="text-center text-green-300">
              <div className="text-2xl mb-1">✅</div>
              <div className="font-bold">¡Listo!</div>
              <div className="text-xs text-fma-white-soft/70 mt-1">
                Te registramos como referido de {nombreRef}. Te vamos a contactar por WhatsApp para coordinar el servicio.
              </div>
            </div>
          </div>
        )}

        {sp.err && (
          <div className="card mb-4 border-red-500/40">
            <div className="text-center text-red-300 text-sm">{decodeURIComponent(sp.err)}</div>
          </div>
        )}

        {!sp.ok && !completo && (
          <div className="card">
            <h2 className="text-fma-white font-bold mb-3">Registrate como referido</h2>
            <form action={registrarReferidoPublico} className="space-y-2">
              <input type="hidden" name="codigo" value={c.codigo} />
              <input name="nombre" required placeholder="Tu nombre completo *"
                className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white" />
              <input name="telefono" required placeholder="Tu WhatsApp (ej 3489...) *"
                className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white" />
              <input name="vehiculo_dominio" placeholder="Patente (opcional)"
                className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white uppercase" />
              <input name="servicio" required placeholder="¿Qué servicio necesitás? *"
                className="w-full bg-fma-black-3 border border-fma-gray-light rounded px-3 py-2 text-fma-white" />
              <button type="submit" className="btn-primary w-full">Confirmar registro</button>
            </form>
            <p className="text-xs text-fma-white-soft/40 mt-3 text-center">
              Premio: {PREMIO_LABEL[c.premioTipo]}
            </p>
          </div>
        )}

        {completo && (
          <div className="card border-green-500/40">
            <div className="text-center text-green-300">
              <div className="text-3xl mb-2">🏆</div>
              <div className="font-bold">{nombreRef} ya completó el premio</div>
              <div className="text-xs text-fma-white-soft/70 mt-2">
                Pero igual podemos atenderte. Contactanos directamente al WhatsApp del taller.
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-fma-white-soft/40 mt-6">
          ¿Querés contactarnos directo?{' '}
          <a href="https://wa.me/5493489681980" className="text-fma-cyan hover:underline">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
