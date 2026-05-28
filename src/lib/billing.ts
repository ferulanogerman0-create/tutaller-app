import 'server-only';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PLANS, type PlanKey } from './plans';
export { PLANS, type PlanKey } from './plans';

function getMPClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN not configured');
  return new MercadoPagoConfig({ accessToken: token });
}

export async function createMPPreference(plan: PlanKey, tenantSlug: string, appUrl: string) {
  const p = PLANS[plan];
  const client = getMPClient();
  const pref = new Preference(client);

  const result = await pref.create({
    body: {
      items: [{
        id: `tutaller-${plan}`,
        title: `TuTaller.app — Plan ${p.name}`,
        description: p.description,
        quantity: 1,
        unit_price: p.priceARS,
        currency_id: 'ARS',
      }],
      back_urls: {
        success: `${appUrl}/${tenantSlug}/billing?status=success`,
        failure: `${appUrl}/${tenantSlug}/billing?status=failure`,
        pending: `${appUrl}/${tenantSlug}/billing?status=pending`,
      },
      auto_return: 'approved',
      external_reference: `${tenantSlug}:${plan}`,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
    },
  });

  return result.init_point!;
}

export function daysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const diff = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > Date.now();
}

export function isTenantActive(plan: string, trialEndsAt: Date | null): boolean {
  if (plan !== 'trial') return true;
  return isTrialActive(trialEndsAt);
}
