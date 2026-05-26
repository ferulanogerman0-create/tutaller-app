import { NextResponse } from 'next/server';

/**
 * Bearer token auth para endpoints /api/bot/*.
 * Token vive en env BOT_AUTH_TOKEN. n8n manda Authorization: Bearer <token>.
 * Devuelve NextResponse 401 si falla, null si OK.
 */
export function requireBotToken(req: Request): NextResponse | null {
  const expected = process.env.BOT_AUTH_TOKEN;
  if (!expected) return NextResponse.json({ error: 'BOT_AUTH_TOKEN not configured' }, { status: 500 });
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== expected) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}
