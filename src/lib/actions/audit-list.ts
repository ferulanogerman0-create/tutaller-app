'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, and, gte } from 'drizzle-orm';
import { ctx } from './_ctx';

export async function listAuditLog(opts: { userId?: number; entityType?: string; days?: number } = {}) {
  const u = await ctx();
  const days = opts.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const conds: ReturnType<typeof eq>[] = [
    eq(schema.auditLog.tenantId, u.tenantId),
    gte(schema.auditLog.createdAt, since),
  ];
  if (opts.userId) conds.push(eq(schema.auditLog.userId, opts.userId));
  if (opts.entityType) conds.push(eq(schema.auditLog.entityType, opts.entityType));

  return db.select({
    id: schema.auditLog.id,
    action: schema.auditLog.action,
    entityType: schema.auditLog.entityType,
    entityId: schema.auditLog.entityId,
    payload: schema.auditLog.payload,
    createdAt: schema.auditLog.createdAt,
    userId: schema.auditLog.userId,
    userName: schema.users.nombre,
  })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.userId))
    .where(and(...conds))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(500);
}
