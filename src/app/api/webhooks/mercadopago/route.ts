import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { type PlanKey } from '@/lib/billing';
import { invalidateTenantCache } from '@/lib/tenant';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const type = body.type as string;
  const dataId = body.data?.id as string;

  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true });

  // Fetch payment details from MP API
  const mpToken = process.env.MP_ACCESS_TOKEN;
  if (!mpToken) return NextResponse.json({ error: 'mp not configured' }, { status: 500 });

  const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  });
  if (!paymentRes.ok) return NextResponse.json({ ok: true });

  const payment = await paymentRes.json();
  if (payment.status !== 'approved') return NextResponse.json({ ok: true });

  const externalRef = payment.external_reference as string;
  if (!externalRef) return NextResponse.json({ ok: true });

  const [tenantSlug, plan] = externalRef.split(':') as [string, PlanKey];
  if (!tenantSlug || !plan) return NextResponse.json({ ok: true });

  const [tenant] = await db.select({ id: schema.tenants.id }).from(schema.tenants)
    .where(eq(schema.tenants.slug, tenantSlug)).limit(1);
  if (!tenant) return NextResponse.json({ ok: true });

  await db.update(schema.tenants).set({
    plan: plan as 'web' | 'bot' | 'enterprise',
    subscriptionId: String(dataId),
    trialEndsAt: null,
    updatedAt: new Date(),
  }).where(eq(schema.tenants.id, tenant.id));

  invalidateTenantCache(tenantSlug);

  return NextResponse.json({ ok: true });
}
