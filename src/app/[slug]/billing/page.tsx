'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PLANS, type PlanKey } from '@/lib/plans';

type TenantInfo = {
  plan: string;
  trialEndsAt: string | null;
  daysRemaining: number;
  nombre: string;
};

export default function BillingPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState<PlanKey | null>(null);

  useEffect(() => {
    fetch(`/api/billing/info`).then(r => r.json()).then(setTenant).catch(() => {});
  }, []);

  async function upgrade(plan: PlanKey) {
    setLoading(plan);
    const r = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const d = await r.json();
    if (d.url) window.location.href = d.url;
    else { alert(d.error || 'Error'); setLoading(null); }
  }

  const isActive = (plan: string) => tenant?.plan === plan;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-fma-white mb-2">Plan y facturación</h1>

      {status === 'success' && (
        <div className="mb-6 bg-green-900/30 border border-green-500/40 text-green-300 rounded-lg px-4 py-3 text-sm">
          ✓ Pago confirmado. Tu plan fue actualizado. ¡Gracias!
        </div>
      )}
      {status === 'failure' && (
        <div className="mb-6 bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">
          ✗ El pago no se completó. Intentalo de nuevo.
        </div>
      )}

      {tenant && (
        <div className="mb-6 card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fma-white-soft/50 mb-1">Plan actual</p>
              <p className="text-xl font-bold text-fma-white capitalize">{tenant.plan}</p>
            </div>
            {tenant.plan === 'trial' && (
              <div className={`text-right ${tenant.daysRemaining <= 3 ? 'text-red-400' : 'text-orange-400'}`}>
                <p className="text-2xl font-bold">{tenant.daysRemaining}</p>
                <p className="text-xs">días restantes</p>
              </div>
            )}
            {tenant.plan !== 'trial' && (
              <div className="bg-green-900/30 border border-green-500/30 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                Activo
              </div>
            )}
          </div>
          {tenant.plan === 'trial' && tenant.daysRemaining === 0 && (
            <p className="text-red-400 text-sm mt-2">Tu período de prueba venció. Activá un plan para continuar.</p>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold text-fma-white mb-4">Elegir plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
          <div key={key} className={`card flex flex-col ${key === 'bot' ? 'border-fma-cyan' : ''}`}>
            {key === 'bot' && (
              <span className="text-xs bg-fma-cyan text-fma-black font-bold px-2 py-0.5 rounded-full self-start mb-2">Más popular</span>
            )}
            <h3 className="font-bold text-lg text-fma-white">{plan.name}</h3>
            <div className="flex items-baseline gap-1 my-2">
              <span className={`text-2xl font-bold ${key === 'bot' ? 'text-fma-cyan' : 'text-fma-white'}`}>
                USD {plan.priceUSD}
              </span>
              <span className="text-fma-white-soft/40 text-xs">/mes</span>
            </div>
            <ul className="space-y-1 flex-1 mb-4 text-sm text-fma-white-soft/60">
              {plan.features.map(f => <li key={f}>✓ {f}</li>)}
            </ul>
            {isActive(key) ? (
              <div className="text-center text-xs text-green-400 py-2 border border-green-500/30 rounded-md">
                Plan actual
              </div>
            ) : (
              <button
                onClick={() => upgrade(key)}
                disabled={!!loading}
                className={`${key === 'bot' ? 'btn-primary' : 'btn-secondary'} w-full text-sm disabled:opacity-50`}
              >
                {loading === key ? 'Redirigiendo…' : `Activar ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card text-sm text-fma-white-soft/50">
        <p className="font-medium text-fma-white-soft/70 mb-2">Información</p>
        <ul className="space-y-1">
          <li>• Pagos procesados por MercadoPago. Aceptamos todas las tarjetas.</li>
          <li>• También disponible en ARS — precio equivalente al tipo de cambio oficial.</li>
          <li>• Cancelación en cualquier momento. Sin contratos ni permanencia.</li>
          <li>• Consultas: <a href="mailto:hola@tutaller.app" className="text-fma-cyan hover:underline">hola@tutaller.app</a></li>
        </ul>
      </div>
    </div>
  );
}
