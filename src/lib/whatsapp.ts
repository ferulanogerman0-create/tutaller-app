// WhatsApp sender: 2 backends
// 1) Evolution API directo: requiere EVOLUTION_API_URL + EVOLUTION_API_KEY + EVOLUTION_INSTANCE
// 2) Webhook n8n: requiere WHATSAPP_WEBHOOK_URL (POSTea payload, n8n decide cómo enviar)

export type WhatsAppPayload = {
  phone: string;            // E.164 sin '+': 5493489XXXXXXX
  caption: string;          // texto del mensaje
  pdfBase64: string;        // PDF en base64
  fileName: string;
  instance: string;         // instancia Evolution PROPIA del tenant (multi-tenant: nunca global)
  meta?: Record<string, unknown>;
};

function normalizarTel(raw: string): string | null {
  if (!raw) return null;
  let t = raw.replace(/\D/g, '');
  if (!t) return null;
  // Argentina: prefijo 54 sin el 9 (Evolution maneja el 9 automáticamente para móviles)
  if (t.startsWith('15')) t = t.slice(2);
  // Sacar 9 si vino con 549...
  if (t.startsWith('549')) t = '54' + t.slice(3);
  // Agregar 54 si falta
  if (!t.startsWith('54')) t = '54' + t;
  return t;
}

export function getTelefonoNormalizado(raw: string | null | undefined): string | null {
  return raw ? normalizarTel(raw) : null;
}

export async function enviarWhatsApp(p: WhatsAppPayload): Promise<{ ok: boolean; via: string; resp?: unknown; error?: string }> {
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const evoInst = p.instance;  // SIEMPRE instancia del tenant, NUNCA global (multi-tenant)
  const webhook = process.env.WHATSAPP_WEBHOOK_URL;

  if (evoUrl && evoKey && evoInst) {
    try {
      const r = await fetch(`${evoUrl.replace(/\/$/, '')}/message/sendMedia/${evoInst}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: evoKey },
        body: JSON.stringify({
          number: p.phone,
          mediatype: 'document',
          mimetype: 'application/pdf',
          media: p.pdfBase64,
          fileName: p.fileName,
          caption: p.caption,
        }),
      });
      const resp = await r.json().catch(() => null);
      // Evolution puede devolver 400 con response.message[0].exists=false (número no en WhatsApp)
      const respMsg = resp?.response?.message;
      if (!r.ok && Array.isArray(respMsg) && respMsg[0]?.exists === false) {
        return { ok: false, via: 'evolution', resp, error: `Número ${respMsg[0].number || p.phone} no está registrado en WhatsApp. Verificá el teléfono del cliente.` };
      }
      return { ok: r.ok, via: 'evolution', resp, error: r.ok ? undefined : (resp?.message || resp?.error || `HTTP ${r.status}`) };
    } catch (e) {
      return { ok: false, via: 'evolution', error: String(e) };
    }
  }

  if (webhook) {
    try {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p }),
      });
      const resp = await r.json().catch(() => null);
      return { ok: r.ok, via: 'webhook', resp, error: r.ok ? undefined : `${r.status}` };
    } catch (e) {
      return { ok: false, via: 'webhook', error: String(e) };
    }
  }

  return { ok: false, via: 'none', error: 'No configuré WhatsApp. Setear EVOLUTION_API_URL+KEY+INSTANCE o WHATSAPP_WEBHOOK_URL' };
}
