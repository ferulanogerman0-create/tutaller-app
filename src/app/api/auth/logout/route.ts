import { NextResponse } from 'next/server';
import { destroySession, getSessionUser } from '@/lib/auth';

function buildUrl(req: Request, path: string) {
  const fwdHost = req.headers.get('x-forwarded-host');
  const fwdProto = req.headers.get('x-forwarded-proto');
  if (fwdHost) return `${fwdProto || 'https'}://${fwdHost}${path}`;
  return new URL(path, req.url).toString();
}

export async function POST(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug');
  await destroySession();
  const loginPath = slug ? `/${slug}/login` : '/';
  return NextResponse.redirect(buildUrl(req, loginPath));
}
