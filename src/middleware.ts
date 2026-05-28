import { NextResponse, type NextRequest } from 'next/server';

// Paths that don't require tenant context (landing, auth, marketing)
const ROOT_PUBLIC = [
  '/', '/login', '/signup', '/pricing', '/about', '/legal',
  '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml',
  '/api/auth', '/api/signup', '/api/webhooks',
];

// Paths under /{slug}/... that are public even without session
const TENANT_PUBLIC = ['/login', '/r/', '/api/bot', '/api/cron'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root public paths skip tenant resolution
  if (ROOT_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Extract first path segment as tenant slug: /{slug}/dashboard/...
  const segs = pathname.split('/').filter(Boolean);
  const slug = segs[0];
  if (!slug || slug.length > 32 || !/^[a-z0-9-]+$/.test(slug)) {
    // No slug or invalid format → redirect to landing
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Resolve tenant via internal API (cached). Edge runtime middleware can't directly hit DB.
  // We pass slug to downstream via header; server components do the DB lookup using getTenantBySlug.
  const res = NextResponse.next();
  res.headers.set('x-tenant-slug', slug);

  // Tenant public paths (bot webhook, cron) skip session check
  const subPath = '/' + segs.slice(1).join('/');
  if (TENANT_PUBLIC.some((p) => subPath.startsWith(p))) return res;

  // Require session cookie
  const session = req.cookies.get('tutaller_session');
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = `/${slug}/login`;
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
