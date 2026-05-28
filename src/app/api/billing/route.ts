import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getTenantById } from '@/lib/tenant';
import { createMPPreference, type PlanKey } from '@/lib/billing';

function getAppUrl(req: Request): string {
  const fwdHost = req.headers.get('x-forwarded-host');
  const fwdProto = req.headers.get('x-forwarded-proto') || 'https';
  if (fwdHost) return `${fwdProto}://${fwdHost}`;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (u.role !== 'owner') return NextResponse.json({ error: 'owner only' }, { status: 403 });

  const { plan } = await req.json() as { plan: PlanKey };
  if (!['web', 'bot', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'invalid plan' }, { status: 400 });
  }

  const tenant = await getTenantById(u.tenantId);
  if (!tenant) return NextResponse.json({ error: 'tenant not found' }, { status: 404 });

  const appUrl = getAppUrl(req);
  const preferenceUrl = await createMPPreference(plan, tenant.slug, appUrl);

  return NextResponse.json({ url: preferenceUrl });
}
