import 'server-only';
import { getConfig } from '@/lib/actions/config';
import { notificarTelegram } from '@/lib/telegram';

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const EVO_INST = process.env.EVOLUTION_INSTANCE;

type TipoAlerta = 'nueva_orden' | 'pago_recibido' | 'stock_bajo' | 'completado' | 'referido' | 'cierre';

async function sendWaGroup(groupId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!EVO_URL || !EVO_KEY || !EVO_INST) return { ok: false, error: 'Evolution sin config' };
  try {
    const r = await fetch(`${EVO_URL.replace(/\/$/, '')}/message/sendText/${EVO_INST}`, {
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

export { sendWaGroup };

export async function notificar(tipo: TipoAlerta, text: string, tenantId?: number): Promise<{ wa?: boolean; tg?: boolean }> {
  const result: { wa?: boolean; tg?: boolean } = {};

  try {
    const waEnabled = await getConfig('wa_alertas_enabled', tenantId);
    if (waEnabled === 'true') {
      const grupoTag = await getConfig(`wa_alerta_${tipo}_grupo` as Parameters<typeof getConfig>[0], tenantId).catch(() => 'taller');
      if (grupoTag === 'off') return result;
      const grupoId = await getConfig(`wa_grupo_${grupoTag}` as Parameters<typeof getConfig>[0], tenantId).catch(() => '');
      if (grupoId) {
        const r = await sendWaGroup(grupoId, text);
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
