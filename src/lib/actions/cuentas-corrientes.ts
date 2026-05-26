'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, sql, ne, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';

export async function listClientesConSaldo() {
  const u = await ctx();
  return await db.select({
    id: schema.clientes.id,
    nombre: schema.clientes.nombre,
    telefono: schema.clientes.telefono,
    saldo: schema.clientes.saldoCuentaCorriente,
  })
    .from(schema.clientes)
    .where(and(
      eq(schema.clientes.tenantId, u.tenantId),
      ne(schema.clientes.saldoCuentaCorriente, '0'),
    ))
    .orderBy(desc(schema.clientes.saldoCuentaCorriente))
    .limit(500);
}

export async function getResumenCtaCte() {
  const u = await ctx();
  const [r] = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE CAST(saldo_cuenta_corriente AS NUMERIC) > 0)::INT AS deudores,
      COUNT(*) FILTER (WHERE CAST(saldo_cuenta_corriente AS NUMERIC) < 0)::INT AS a_favor,
      COALESCE(SUM(CASE WHEN CAST(saldo_cuenta_corriente AS NUMERIC) > 0 THEN CAST(saldo_cuenta_corriente AS NUMERIC) ELSE 0 END), 0)::FLOAT AS total_deuda,
      COALESCE(SUM(CASE WHEN CAST(saldo_cuenta_corriente AS NUMERIC) < 0 THEN CAST(saldo_cuenta_corriente AS NUMERIC) ELSE 0 END), 0)::FLOAT AS total_a_favor
    FROM clientes
    WHERE tenant_id = ${u.tenantId}
  `) as unknown as { deudores: number; a_favor: number; total_deuda: number; total_a_favor: number }[];
  return r;
}

export async function getClienteCtaCte(clienteId: number) {
  const u = await ctx();
  const cliente = await db.select().from(schema.clientes)
    .where(and(eq(schema.clientes.id, clienteId), eq(schema.clientes.tenantId, u.tenantId)))
    .limit(1);
  if (!cliente[0]) return null;

  const ordenes = await db.select({
    id: schema.ordenes.id,
    comprobante: schema.ordenes.comprobante,
    fecha: schema.ordenes.fechaIngreso,
    total: schema.ordenes.totalBruto,
    pagoEfectivo: schema.ordenes.pagoEfectivo,
    pagoOtro: schema.ordenes.pagoOtroMonto,
    pagoEstado: schema.ordenes.pagoEstado,
    estado: schema.ordenes.estado,
  })
    .from(schema.ordenes)
    .where(and(eq(schema.ordenes.clienteId, clienteId), eq(schema.ordenes.tenantId, u.tenantId)))
    .orderBy(desc(schema.ordenes.fechaIngreso))
    .limit(100);

  return { cliente: cliente[0], ordenes };
}

export async function registrarPagoCliente(formData: FormData) {
  const u = await ctx();
  const clienteId = Number(formData.get('cliente_id'));
  const monto = Number(formData.get('monto') || 0);
  const medio = String(formData.get('medio') || 'efectivo');
  const detalle = String(formData.get('detalle') || 'Pago a cuenta').trim();
  if (!clienteId || monto <= 0) throw new Error('faltan campos');

  await db.insert(schema.cajaMovimientos).values({
    tenantId: u.tenantId,
    tipo: 'ingreso',
    detalle: `${detalle} — Cliente #${clienteId}`,
    efectivo: medio === 'efectivo' ? String(monto) : '0',
    otroMedio: medio === 'efectivo' ? null : medio,
    otroMonto: medio === 'efectivo' ? '0' : String(monto),
    total: String(monto),
    createdBy: u.id,
  });

  await db.update(schema.clientes)
    .set({ saldoCuentaCorriente: sql`CAST(${schema.clientes.saldoCuentaCorriente} AS NUMERIC) - ${monto}`, updatedAt: new Date() })
    .where(and(eq(schema.clientes.id, clienteId), eq(schema.clientes.tenantId, u.tenantId)));

  revalidatePath('/dashboard/cuentas-corrientes');
  revalidatePath(`/dashboard/cuentas-corrientes/${clienteId}`);
  revalidatePath('/dashboard/caja');
}
