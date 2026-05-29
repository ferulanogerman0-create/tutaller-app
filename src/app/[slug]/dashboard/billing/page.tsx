import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getTenantById } from '@/lib/tenant';
import { daysRemaining } from '@/lib/billing';
import { PLANS, type PlanKey } from '@/lib/plans';
import { startCheckout } from '@/lib/actions/billing';

const STATUS_MSG: Record<string, { text: string; cls: string }> = {
  success: { text: '✓ Pago aprobado. Tu plan se actualizará en unos segundos.', cls: 'bg-green-900/40 border-green-500/30 text-green-300' },
  pending: { text: '⏳ Pago pendiente de confirmación.', cls: 'bg-orange-900/40 border-orange-500/30 text-orange-300' },
  failure: { text: '✗ El pago no se completó. Probá de nuevo.', cls: 'bg-red-900/40 border-red-500/30 text-red-300' },
  mp_error: { text: '⚠ MercadoPago no está configurado todavía. Avisá al soporte.', cls: 'bg-red-900/40 border-red-500/30 text-red-300' },
  invalid: { text: '⚠ Plan inválido.', cls: 'bg-red-900/40 border-red-500/30 text-red-300' },
};

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/${slug}/login`);
  const tenant = await getTenantById(user.tenantId);
  if (!tenant) redirect(`/${slug}/login`);

  const isTrial = tenant.plan === 'trial';
  const days = daysRemaining(tenant.trialEndsAt);
  const planOrder: PlanKey[] = ['web', 'bot', 'enterprise'];
  const banner = status ? STATUS_MSG[status] : null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-fma-white mb-1">Plan y facturación</h1>
      <p className="text-sm text-fma-white-soft/50 mb-6">Gestioná la suscripción de tu taller.</p>

      {banner && (
        <div className={`rounded-lg border px-4 py-3 text-sm mb-6 ${banner.cls}`}>{banner.text}</div>
      )}

      {/* Estado actual */}
      <div className="card mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-fma-white-soft/40 mb-1">Plan actual</div>
          <div className="text-xl font-bold text-fma-white capitalize">
            {isTrial ? 'Prueba gratis' : (PLANS[tenant.plan as PlanKey]?.name ?? tenant.plan)}
          </div>
        </div>
        {isTrial && (
          <div className={`text-sm font-medium px-3 py-1.5 rounded-full ${days === 0 ? 'bg-red-900/50 text-red-300' : days <= 3 ? 'bg-orange-900/40 text-orange-300' : 'bg-fma-black-3 text-fma-white-soft/70'}`}>
            {days === 0 ? 'Trial vencido' : `${days} día${days === 1 ? '' : 's'} de prueba`}
          </div>
        )}
      </div>

      {/* Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planOrder.map((key) => {
          const p = PLANS[key];
          const isCurrent = tenant.plan === key;
          const highlight = key === 'bot';
          return (
            <div
              key={key}
              className={`card flex flex-col ${highlight ? 'border-fma-cyan/40' : ''} ${isCurrent ? 'ring-1 ring-fma-cyan' : ''}`}
            >
              {highlight && (
                <div className="self-start bg-fma-cyan/15 border border-fma-cyan/30 text-fma-cyan text-xs font-bold px-2.5 py-0.5 rounded-full mb-3">
                  Más elegido
                </div>
              )}
              <h3 className="text-sm font-bold uppercase tracking-widest text-fma-white-soft/50 mb-1">{p.name}</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black text-fma-white">${p.priceARS.toLocaleString('es-AR')}</span>
                <span className="text-xs text-fma-white-soft/40 mb-1.5">/mes</span>
              </div>
              <div className="text-xs text-fma-white-soft/40 mb-4">USD {p.priceUSD} · tipo de cambio oficial</div>
              <ul className="space-y-2 flex-1 mb-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-fma-white-soft/80">
                    <span className="text-fma-cyan mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-md text-sm font-semibold bg-fma-black-3 text-fma-white-soft/60 border border-fma-gray">
                  Plan actual
                </div>
              ) : (
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value={key} />
                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-md text-sm font-bold transition-colors ${highlight ? 'bg-fma-cyan text-fma-black hover:bg-fma-cyan-light' : 'bg-fma-black-3 text-fma-white border border-fma-gray-light hover:bg-fma-gray'}`}
                  >
                    {isTrial ? 'Activar plan' : 'Cambiar a este plan'}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-fma-white-soft/30 mt-6">
        Pagos procesados por MercadoPago. Podés cancelar cuando quieras. Precios en ARS al tipo de cambio oficial.
      </p>
    </div>
  );
}
