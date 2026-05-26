'use server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctxAdmin, getSlug } from './_ctx';
import { CONFIG_DEFAULTS, type ConfigKey } from '@/lib/config-constants';

export async function getConfig<K extends ConfigKey>(key: K, tenantId?: number): Promise<string> {
  if (!tenantId) return CONFIG_DEFAULTS[key];
  const rows = await db.select().from(schema.config)
    .where(and(eq(schema.config.tenantId, tenantId), eq(schema.config.key, key)))
    .limit(1);
  return rows[0]?.value ?? CONFIG_DEFAULTS[key];
}

export async function getAllConfig(tenantId?: number): Promise<Record<ConfigKey, string>> {
  const out: Record<string, string> = { ...CONFIG_DEFAULTS };
  if (!tenantId) return out as Record<ConfigKey, string>;
  const rows = await db.select().from(schema.config).where(eq(schema.config.tenantId, tenantId));
  for (const r of rows) {
    if (r.key in CONFIG_DEFAULTS) out[r.key] = r.value || '';
  }
  return out as Record<ConfigKey, string>;
}

export async function setConfig(formData: FormData) {
  const u = await ctxAdmin();
  const slug = await getSlug();
  for (const key of Object.keys(CONFIG_DEFAULTS) as ConfigKey[]) {
    const value = String(formData.get(key) ?? '');
    const existing = await db.select({ key: schema.config.key })
      .from(schema.config)
      .where(and(eq(schema.config.tenantId, u.tenantId), eq(schema.config.key, key)))
      .limit(1);
    if (existing[0]) {
      await db.update(schema.config).set({ value, updatedAt: new Date(), updatedBy: u.id })
        .where(and(eq(schema.config.tenantId, u.tenantId), eq(schema.config.key, key)));
    } else {
      await db.insert(schema.config).values({ tenantId: u.tenantId, key, value, updatedBy: u.id });
    }
  }
  revalidatePath(`/${slug}/dashboard/configuracion`);
}
