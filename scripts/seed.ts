import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  // Ensure demo tenant exists
  const slug = process.env.SEED_TENANT_SLUG || 'fma';
  let [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug)).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(schema.tenants).values({
      slug,
      nombre: process.env.SEED_TENANT_NOMBRE || 'FMA Mecatrónica',
    }).returning();
    console.log(`Tenant "${slug}" created (id: ${tenant.id})`);
  } else {
    console.log(`Tenant "${slug}" already exists (id: ${tenant.id})`);
  }

  // Admin user
  const adminUser = process.env.SEED_ADMIN_USER || 'german';
  const adminPass = process.env.SEED_ADMIN_PASS || 'fma1234';
  const existing = await db.select().from(schema.users)
    .where(and(eq(schema.users.username, adminUser), eq(schema.users.tenantId, tenant.id)))
    .limit(1);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(adminPass, 12);
    await db.insert(schema.users).values({
      tenantId: tenant.id,
      username: adminUser,
      passwordHash: hash,
      nombre: 'Germán Ferulano',
      email: 'ferulanogerman0@gmail.com',
      role: 'admin',
      activo: true,
    });
    console.log(`Admin user "${adminUser}" created (pass: ${adminPass})`);
  } else {
    console.log(`Admin user "${adminUser}" already exists.`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
