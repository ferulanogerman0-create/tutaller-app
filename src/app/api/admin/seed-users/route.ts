import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

type UserToCreate = { username: string; nombre: string; role: 'admin' | 'mecanico' | 'recepcion' | 'contable'; password: string };

const USERS: UserToCreate[] = [
  { username: 'facundo', nombre: 'Facundo Ferulano', role: 'admin', password: 'fma1234' },
  { username: 'adrian', nombre: 'Adrian Barrionuevo', role: 'mecanico', password: 'fma1234' },
  { username: 'sol', nombre: 'Sol Morales', role: 'admin', password: 'sol1234' },
];

export async function POST() {
  const me = await getSessionUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const results: { username: string; status: string }[] = [];
  for (const u of USERS) {
    const existing = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.username, u.username), eq(schema.users.tenantId, me.tenantId)))
      .limit(1);
    if (existing[0]) { results.push({ username: u.username, status: 'ya existe' }); continue; }
    const hash = await bcrypt.hash(u.password, 12);
    await db.insert(schema.users).values({
      tenantId: me.tenantId,
      username: u.username, nombre: u.nombre, role: u.role, passwordHash: hash, activo: true,
    });
    results.push({ username: u.username, status: 'creado' });
  }
  return NextResponse.json({ ok: true, results });
}
