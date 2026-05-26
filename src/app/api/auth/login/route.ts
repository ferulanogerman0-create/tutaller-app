import { NextResponse } from 'next/server';
import { loginWithCredentials } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

function buildUrl(req: Request, path: string) {
  const fwdHost = req.headers.get('x-forwarded-host');
  const fwdProto = req.headers.get('x-forwarded-proto');
  if (fwdHost) return `${fwdProto || 'https'}://${fwdHost}${path}`;
  return new URL(path, req.url).toString();
}

export async function POST(req: Request) {
  const form = await req.formData();
  const slug = String(form.get('slug') || '').trim();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');

  if (!username || !password || !slug) {
    return NextResponse.redirect(buildUrl(req, `/${slug || 'login'}?error=missing`));
  }

  const [tenant] = await db.select({ id: schema.tenants.id }).from(schema.tenants)
    .where(eq(schema.tenants.slug, slug)).limit(1);
  if (!tenant) {
    return NextResponse.redirect(buildUrl(req, `/${slug}/login?error=invalid`));
  }

  const user = await loginWithCredentials(tenant.id, username, password);
  if (!user) {
    return NextResponse.redirect(buildUrl(req, `/${slug}/login?error=invalid`));
  }
  return NextResponse.redirect(buildUrl(req, `/${slug}/dashboard`));
}
