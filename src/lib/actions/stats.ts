'use server';
import { db, schema } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { ctx } from './_ctx';

export async function facturacionMensual(meses = 12) {
  const u = await ctx();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - meses + 1);
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);

  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(fecha_ingreso, 'YYYY-MM') AS mes,
      SUM(CAST(total_bruto AS NUMERIC))::FLOAT AS total,
      COUNT(*)::INT AS cantidad
    FROM ordenes
    WHERE tenant_id = ${u.tenantId}
      AND fecha_ingreso >= ${desde.toISOString()}
      AND es_presupuesto = false
    GROUP BY mes
    ORDER BY mes ASC
  `);
  return rows as unknown as Array<{ mes: string; total: number; cantidad: number }>;
}

export async function ordenesPorEstado() {
  const u = await ctx();
  const rows = await db.execute(sql`
    SELECT estado, COUNT(*)::INT AS cantidad
    FROM ordenes
    WHERE tenant_id = ${u.tenantId}
      AND es_presupuesto = false
    GROUP BY estado
    ORDER BY estado
  `);
  return rows as unknown as Array<{ estado: string; cantidad: number }>;
}

export async function topClientes(limite = 10) {
  const u = await ctx();
  const rows = await db.execute(sql`
    SELECT
      c.id, c.nombre,
      COUNT(o.id)::INT AS ordenes,
      SUM(CAST(o.total_bruto AS NUMERIC))::FLOAT AS facturado
    FROM clientes c
    JOIN ordenes o ON o.cliente_id = c.id
    WHERE o.tenant_id = ${u.tenantId}
      AND o.es_presupuesto = false
    GROUP BY c.id, c.nombre
    ORDER BY facturado DESC NULLS LAST
    LIMIT ${limite}
  `);
  return rows as unknown as Array<{ id: number; nombre: string; ordenes: number; facturado: number }>;
}

export async function topMarcas(limite = 10) {
  const u = await ctx();
  const rows = await db.execute(sql`
    SELECT
      COALESCE(v.marca, 'Sin marca') AS marca,
      COUNT(o.id)::INT AS ordenes,
      SUM(CAST(o.total_bruto AS NUMERIC))::FLOAT AS facturado
    FROM ordenes o
    LEFT JOIN vehiculos v ON v.id = o.vehiculo_id
    WHERE o.tenant_id = ${u.tenantId}
      AND o.es_presupuesto = false
    GROUP BY v.marca
    ORDER BY ordenes DESC
    LIMIT ${limite}
  `);
  return rows as unknown as Array<{ marca: string; ordenes: number; facturado: number }>;
}

export async function ingresoMedioPago(desde: Date, hasta: Date) {
  const u = await ctx();
  const rows = await db.execute(sql`
    SELECT
      SUM(CAST(pago_efectivo AS NUMERIC))::FLOAT AS efectivo,
      SUM(CAST(pago_otro_monto AS NUMERIC))::FLOAT AS otros,
      SUM(CAST(pago_cuenta_corriente AS NUMERIC))::FLOAT AS cuenta_corriente
    FROM ordenes
    WHERE tenant_id = ${u.tenantId}
      AND fecha_ingreso BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
      AND es_presupuesto = false
  `);
  return (rows[0] || { efectivo: 0, otros: 0, cuenta_corriente: 0 }) as { efectivo: number; otros: number; cuenta_corriente: number };
}

export async function resumenPeriodo(desde: Date, hasta: Date) {
  const u = await ctx();
  const rows = await db.execute(sql`
    SELECT
      COUNT(*)::INT AS total_ordenes,
      SUM(CAST(total_bruto AS NUMERIC))::FLOAT AS facturado,
      SUM(CAST(total_neto AS NUMERIC))::FLOAT AS neto,
      SUM(CAST(total_iva AS NUMERIC))::FLOAT AS iva,
      SUM(CAST(total_repuestos AS NUMERIC))::FLOAT AS repuestos,
      SUM(CAST(total_mano_obra AS NUMERIC))::FLOAT AS mano_obra,
      SUM(CAST(pago_efectivo AS NUMERIC) + CAST(pago_otro_monto AS NUMERIC))::FLOAT AS cobrado
    FROM ordenes
    WHERE tenant_id = ${u.tenantId}
      AND fecha_ingreso BETWEEN ${desde.toISOString()} AND ${hasta.toISOString()}
      AND es_presupuesto = false
  `);
  return (rows[0] || {}) as { total_ordenes: number; facturado: number; neto: number; iva: number; repuestos: number; mano_obra: number; cobrado: number };
}
