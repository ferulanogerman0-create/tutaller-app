import { NextResponse } from 'next/server';
import { createCodigo } from '@/lib/actions/referidos';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await req.formData();
  try {
    await createCodigo(form);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e;
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/${slug}/dashboard/referidos`, 303);
}
