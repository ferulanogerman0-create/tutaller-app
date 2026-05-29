import 'server-only';
import { getConfig } from '@/lib/actions/config';
import { notificarTelegram } from '@/lib/telegram';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;

type TipoAlerta = 'nueva_orden' | 'pago_recibido' | 'stock_bajo' | 'completado' | 'referido' | 'cierre';

// IMPORTANTE multi-tenant: SIEMPRE usar la instancia Evolution propia del tenant.
// NUNCA caer al EVOLUTION_INSTANCE global (es el de FMA) para otros tenants → leak.
async function sendWaGroup(instance: string, groupId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!EVO_URL || !EVO_KEY || !instance) return { ok: false, error: 'Evolution sin instancia del tenant' };
  try {
    const r = await fetch(`${EVO_URL.replace(/\/$/, '')}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: groupId, text }),
    });
    if (!r.ok) return { ok: false, error: `${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function getTenantInstance(tenantId?: number): Promise<string> {
  if (!tenantId) return '';
  const [t] = await db.select({ evo: schema.tenants.evoInstanceName }).from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
  return t?.evo || '';
}

export async function notificar(tipo: TipoAlerta, text: string, tenantId?: number): Promise<{ wa?: boolean; tg?: boolean }> {
  const result: { wa?: boolean; tg?: boolean } = {};

  try {
    const waEnabled = await getConfig('wa_alertas_enabled', tenantId);
    const instance = await getTenantInstance(tenantId);
    if (waEnabled === 'true' && instance) {
      const grupoTag = await getConfig(`wa_alerta_${tipo}_grupo` as Parameters<typeof getConfig>[0], tenantId).catch(() => 'off');
      if (grupoTag === 'off') return result;
      const grupoId = await getConfig(`wa_grupo_${grupoTag}` as Parameters<typeof getConfig>[0], tenantId).catch(() => '');
      if (grupoId) {
        const r = await sendWaGroup(instance, grupoId, text);
        result.wa = r.ok;
      }
    }
  } catch (e) {
    console.error('notificar WA failed', e);
  }

  try {
    const tgEnabled = await getConfig('telegram_alertas_enabled', tenantId);
    if (tgEnabled === 'true') {
      const r = await notificarTelegram(text, { tipo, tenantId });
      result.tg = r.ok;
    }
  } catch (e) {
    console.error('notificar TG failed', e);
  }

  return result;
}
