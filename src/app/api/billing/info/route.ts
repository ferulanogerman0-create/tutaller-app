import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getTenantById } from '@/lib/tenant';
import { daysRemaining } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const tenant = await getTenantById(u.tenantId);
  if (!tenant) return NextResponse.json({ error: 'tenant not found' }, { status: 404 });

  return NextResponse.json({
    plan: tenant.plan,
    trialEndsAt: tenant.trialEndsAt,
    daysRemaining: daysRemaining(tenant.trialEndsAt),
    nombre: tenant.nombre,
  });
}
