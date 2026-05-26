import 'server-only';
import { db, schema } from '@/lib/db';

export type AuditAction =
  | 'orden.create' | 'orden.update' | 'orden.delete'
  | 'orden.item.add' | 'orden.item.update' | 'orden.item.delete'
  | 'cliente.create' | 'cliente.update'
  | 'vehiculo.create' | 'vehiculo.update'
  | 'caja.movimiento' | 'caja.apertura' | 'caja.cierre'
  | 'config.update' | 'user.create' | 'user.update'
  | 'referido.create' | 'referido.premio'
  | 'inventario.create' | 'inventario.update' | 'inventario.delete';

export async function audit(
  tenantId: number,
  userId: number | null | undefined,
  action: AuditAction,
  entity: { type: string; id?: number | null },
  payload?: Record<string, unknown>,
) {
  try {
    await db.insert(schema.auditLog).values({
      tenantId,
      userId: userId || null,
      action,
      entityType: entity.type,
      entityId: entity.id || null,
      payload: payload || null,
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}
