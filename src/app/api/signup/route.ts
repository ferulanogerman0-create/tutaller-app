import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession } from '@/lib/auth';

const RESERVED_SLUGS = new Set([
  'api', 'app', 'admin', 'www', 'mail', 'login', 'signup', 'pricing', 'about',
  'legal', 'blog', 'help', 'support', 'status', 'static', 'assets', 'cdn',
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  if (!slug || !/^[a-z0-9-]{3,32}$/.test(slug) || RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false });
  }
  const [existing] = await db.select({ id: schema.tenants.id }).from(schema.tenants)
    .where(eq(schema.tenants.slug, slug)).limit(1);
  return NextResponse.json({ available: !existing });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { nombre, slug, ownerNombre, username, password } = body as Record<string, string>;

  if (!nombre?.trim() || !slug?.trim() || !ownerNombre?.trim() || !username?.trim() || !password) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
  }
  if (!/^[a-z0-9-]{3,32}$/.test(slug) || RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{2,32}$/i.test(username)) {
    return NextResponse.json({ error: 'Usuario inválido (letras, números, _ y -)' }, { status: 400 });
  }

  const [existing] = await db.select({ id: schema.tenants.id }).from(schema.tenants)
    .where(eq(schema.tenants.slug, slug)).limit(1);
  if (existing) return NextResponse.json({ error: 'Ese nombre de taller ya está en uso' }, { status: 409 });

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [tenant] = await db.insert(schema.tenants).values({
    slug: slug.toLowerCase(),
    nombre: nombre.trim(),
    plan: 'trial',
    trialEndsAt,
    activo: true,
  }).returning({ id: schema.tenants.id });

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(schema.users).values({
    tenantId: tenant.id,
    username: username.toLowerCase().trim(),
    nombre: ownerNombre.trim(),
    passwordHash,
    role: 'owner',
    activo: true,
  }).returning({ id: schema.users.id });

  await createSession(user.id, tenant.id);

  return NextResponse.json({ ok: true, slug });
}
