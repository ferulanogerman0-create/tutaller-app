'use server';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

export async function listRecordatorios({ estado }: { estado?: string } = {}) {
  const u = await ctx();
  const conds: ReturnType<typeof eq>[] = [eq(schema.recordatorios.tenantId, u.tenantId)];
  if (estado && estado !== 'todos') conds.push(eq(schema.recordatorios.estado, estado as 'pendiente'));
  return db.query.recordatorios.findMany({
    where: and(...conds),
    with: { cliente: true, vehiculo: true },
    orderBy: [asc(schema.recordatorios.fechaProgramada)],
  });
}

export async function listProximosRecordatorios(dias = 30) {
  const u = await ctx();
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  return db.query.recordatorios.findMany({
    where: and(
      eq(schema.recordatorios.tenantId, u.tenantId),
      eq(schema.recordatorios.estado, 'pendiente'),
      gte(schema.recordatorios.fechaProgramada, hoy),
      lte(schema.recordatorios.fechaProgramada, limite),
    ),
    with: { cliente: true, vehiculo: true },
    orderBy: [asc(schema.recordatorios.fechaProgramada)],
    limit: 10,
  });
}

export async function createRecordatorio(formData: FormData) {
  const u = await ctx();
  const tipo = String(formData.get('tipo') || 'service') as 'service';
  const titulo = String(formData.get('titulo') || '').trim();
  const detalle = String(formData.get('detalle') || '').trim() || null;
  const clienteId = Number(formData.get('clienteId')) || null;
  const vehiculoId = Number(formData.get('vehiculoId')) || null;
  const fecha = String(formData.get('fechaProgramada') || '');
  const km = Number(formData.get('kilometrajeProgramado')) || null;

  if (!titulo || !fecha) throw new Error('campos requeridos');

  await db.insert(schema.recordatorios).values({
    tenantId: u.tenantId,
    tipo, titulo, detalle, clienteId, vehiculoId,
    fechaProgramada: new Date(fecha),
    kilometrajeProgramado: km,
    estado: 'pendiente',
    createdBy: u.id,
  });
  revalidatePath('/dashboard/recordatorios');
  revalidatePath('/dashboard');
}

export async function marcarRecordatorioCompletado(id: number) {
  const u = await ctx();
  await db.update(schema.recordatorios)
    .set({ estado: 'completado', completadoAt: new Date() })
    .where(and(eq(schema.recordatorios.id, id), eq(schema.recordatorios.tenantId, u.tenantId)));
  revalidatePath('/dashboard/recordatorios');
}

export async function cancelarRecordatorio(id: number) {
  const u = await ctx();
  await db.update(schema.recordatorios)
    .set({ estado: 'cancelado' })
    .where(and(eq(schema.recordatorios.id, id), eq(schema.recordatorios.tenantId, u.tenantId)));
  revalidatePath('/dashboard/recordatorios');
}
