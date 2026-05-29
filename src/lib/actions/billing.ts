'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createMPPreference, type PlanKey } from '@/lib/billing';
import { getSlug } from './_ctx';

export async function startCheckout(formData: FormData) {
  const plan = String(formData.get('plan') || '') as PlanKey;
  if (!['web', 'bot', 'enterprise'].includes(plan)) {
    redirect(`/${await getSlug()}/dashboard/billing?status=invalid`);
  }
  const slug = await getSlug();
  const h = await headers();
  const host = h.get('host') || 'tutallerapp.wolfdma.website';
  const proto = h.get('x-forwarded-proto') || 'https';
  const appUrl = `${proto}://${host}`;

  let initPoint: string;
  try {
    initPoint = await createMPPreference(plan, slug, appUrl);
  } catch {
    redirect(`/${slug}/dashboard/billing?status=mp_error`);
  }
  redirect(initPoint);
}
