'use server';
import { db, schema } from '@/lib/db';
import { eq, isNull, desc, and, gte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

export async function getCajaActiva(tenantId: number) {
  const rows = await db.select().from(schema.cajaCierres)
    .where(and(isNull(schema.cajaCierres.fechaCierre), eq(schema.cajaCierres.tenantId, tenantId)))
    .orderBy(desc(schema.cajaCierres.fechaApertura))
    .limit(1);
  return rows[0] || null;
}

export async function listCierres(limite = 50) {
  const u = await ctx();
  return db.select().from(schema.cajaCierres)
    .where(eq(schema.cajaCierres.tenantId, u.tenantId))
    .orderBy(desc(schema.cajaCierres.fechaApertura))
    .limit(limite);
}

export async function getCierre(id: number) {
  const u = await ctx();
  const rows = await db.select().from(schema.cajaCierres)
    .where(and(eq(schema.cajaCierres.id, id), eq(schema.cajaCierres.tenantId, u.tenantId)))
    .limit(1);
  if (!rows[0]) return null;
  const movs = await db.select().from(schema.cajaMovimientos)
    .where(and(eq(schema.cajaMovimientos.cierreId, id), eq(schema.cajaMovimientos.tenantId, u.tenantId)))
    .orderBy(desc(schema.cajaMovimientos.createdAt));
  return { ...rows[0], movimientos: movs };
}

export async function abrirCaja(formData: FormData) {
  const u = await ctx();
  const activa = await getCajaActiva(u.tenantId);
  if (activa) throw new Error('Ya hay una caja abierta');

  const saldoInicial = Number(formData.get('saldo_inicial') || 0);
  const notas = String(formData.get('notas') || '').trim() || null;

  await db.insert(schema.cajaCierres).values({
    tenantId: u.tenantId,
    fechaApertura: new Date(),
    saldoInicial: String(saldoInicial),
    notas,
  });
  revalidatePath('/dashboard/caja');
  revalidatePath('/dashboard/cierres');
}

export async function cerrarCaja(formData: FormData) {
  const u = await ctx();
  const activa = await getCajaActiva(u.tenantId);
  if (!activa) throw new Error('No hay caja abierta');

  const [agg] = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN CAST(total AS NUMERIC) > 0 THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS ingresos,
      COALESCE(SUM(CASE WHEN CAST(total AS NUMERIC) < 0 THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS egresos
    FROM caja_movimientos
    WHERE tenant_id = ${u.tenantId}
      AND created_at >= ${activa.fechaApertura.toISOString()}
      AND cierre_id IS NULL
  `) as unknown as { ingresos: number; egresos: number }[];

  const ingresos = Number(agg.ingresos || 0);
  const egresos = Math.abs(Number(agg.egresos || 0));
  const saldoFinalEsperado = Number(activa.saldoInicial) + ingresos - egresos;
  const saldoContado = Number(formData.get('saldo_contado') || saldoFinalEsperado);
  const notas = String(formData.get('notas') || '').trim() || activa.notas;

  await db.update(schema.cajaCierres).set({
    fechaCierre: new Date(),
    totalIngresos: String(ingresos),
    totalEgresos: String(egresos),
    saldoFinal: String(saldoContado),
    cerradoPor: u.id,
    notas,
  }).where(and(eq(schema.cajaCierres.id, activa.id), eq(schema.cajaCierres.tenantId, u.tenantId)));

  await db.update(schema.cajaMovimientos)
    .set({ cierreId: activa.id })
    .where(and(
      eq(schema.cajaMovimientos.tenantId, u.tenantId),
      gte(schema.cajaMovimientos.createdAt, activa.fechaApertura),
      isNull(schema.cajaMovimientos.cierreId),
    ));

  revalidatePath('/dashboard/caja');
  revalidatePath('/dashboard/cierres');
}

export async function getResumenCajaActiva() {
  const u = await ctx();
  const activa = await getCajaActiva(u.tenantId);
  if (!activa) return null;
  const [agg] = await db.execute(sql`
    SELECT
      COUNT(*)::INT AS movimientos,
      COALESCE(SUM(CASE WHEN CAST(total AS NUMERIC) > 0 THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS ingresos,
      COALESCE(SUM(CASE WHEN CAST(total AS NUMERIC) < 0 THEN CAST(total AS NUMERIC) ELSE 0 END), 0)::FLOAT AS egresos,
      COALESCE(SUM(CAST(efectivo AS NUMERIC)), 0)::FLOAT AS efectivo,
      COALESCE(SUM(CAST(otro_monto AS NUMERIC)), 0)::FLOAT AS otros
    FROM caja_movimientos
    WHERE tenant_id = ${u.tenantId}
      AND created_at >= ${activa.fechaApertura.toISOString()}
      AND cierre_id IS NULL
  `) as unknown as { movimientos: number; ingresos: number; egresos: number; efectivo: number; otros: number }[];
  const ingresos = Number(agg.ingresos || 0);
  const egresos = Math.abs(Number(agg.egresos || 0));
  return {
    activa,
    movimientos: Number(agg.movimientos || 0),
    ingresos, egresos,
    efectivo: Number(agg.efectivo || 0),
    otros: Number(agg.otros || 0),
    saldoEsperado: Number(activa.saldoInicial) + ingresos - egresos,
  };
}
