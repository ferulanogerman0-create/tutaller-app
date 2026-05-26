import { getConfig } from '@/lib/actions/config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8521024198:AAGtKS3DzrmIiyyacD0J1sQZr2ElSDZdFGs';

export async function notificarTelegram(text: string, opts?: { tipo?: string; tenantId?: number }): Promise<{ ok: boolean; error?: string }> {
  try {
    const tid = opts?.tenantId;
    const enabled = await getConfig('telegram_alertas_enabled', tid);
    if (enabled !== 'true') return { ok: false, error: 'disabled' };

    if (opts?.tipo) {
      const tipoKey = `telegram_alerta_${opts.tipo}` as Parameters<typeof getConfig>[0];
      try {
        const tipoEnabled = await getConfig(tipoKey, tid);
        if (tipoEnabled !== 'true') return { ok: false, error: `tipo ${opts.tipo} off` };
      } catch {}
    }

    const chatId = await getConfig('telegram_chat_id', tid);
    if (!chatId) return { ok: false, error: 'no chat_id' };

    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!r.ok) return { ok: false, error: `${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
