'use server';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

export async function listTurnosSemana(inicio: Date) {
  const u = await ctx();
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);
  return db.query.turnos.findMany({
    where: and(
      eq(schema.turnos.tenantId, u.tenantId),
      gte(schema.turnos.fechaInicio, inicio),
      lte(schema.turnos.fechaInicio, fin),
    ),
    with: { cliente: true, vehiculo: true, tecnico: true },
    orderBy: [asc(schema.turnos.fechaInicio)],
  });
}

export async function createTurno(formData: FormData) {
  const u = await ctx();
  const titulo = String(formData.get('titulo') || '').trim();
  const detalle = String(formData.get('detalle') || '').trim() || null;
  const clienteId = Number(formData.get('clienteId')) || null;
  const vehiculoId = Number(formData.get('vehiculoId')) || null;
  const tecnicoId = Number(formData.get('tecnicoId')) || null;
  const fechaInicio = String(formData.get('fechaInicio') || '');
  const fechaFin = String(formData.get('fechaFin') || '') || null;
  if (!titulo || !fechaInicio) throw new Error('faltan campos');
  await db.insert(schema.turnos).values({
    tenantId: u.tenantId,
    titulo, detalle, clienteId, vehiculoId, tecnicoId,
    fechaInicio: new Date(fechaInicio),
    fechaFin: fechaFin ? new Date(fechaFin) : null,
    estado: 'agendado',
    createdBy: u.id,
  });
  revalidatePath('/dashboard/calendario');
}

export async function deleteTurno(id: number) {
  const u = await ctx();
  await db.delete(schema.turnos)
    .where(and(eq(schema.turnos.id, id), eq(schema.turnos.tenantId, u.tenantId)));
  revalidatePath('/dashboard/calendario');
}
