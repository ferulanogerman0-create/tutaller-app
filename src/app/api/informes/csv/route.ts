import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, gte, lte, desc, sql, eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (me.role !== 'admin' && me.role !== 'owner' && me.role !== 'contable') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get('desde') ? new Date(searchParams.get('desde')!) : new Date(0);
  const hasta = searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : new Date();

  const ordenes = await db.select({
    comprobante: schema.ordenes.comprobante,
    fechaIngreso: schema.ordenes.fechaIngreso,
    estado: schema.ordenes.estado,
    pagoEstado: schema.ordenes.pagoEstado,
    totalBruto: schema.ordenes.totalBruto,
    totalNeto: schema.ordenes.totalNeto,
    totalIva: schema.ordenes.totalIva,
    totalRepuestos: schema.ordenes.totalRepuestos,
    totalManoObra: schema.ordenes.totalManoObra,
    pagoEfectivo: schema.ordenes.pagoEfectivo,
    pagoOtroMonto: schema.ordenes.pagoOtroMonto,
    clienteNombre: schema.clientes.nombre,
    clienteDni: schema.clientes.dni,
    vehDominio: schema.vehiculos.dominio,
    vehMarca: schema.vehiculos.marca,
    vehModelo: schema.vehiculos.modelo,
  }).from(schema.ordenes)
    .leftJoin(schema.clientes, sql`${schema.clientes.id} = ${schema.ordenes.clienteId}`)
    .leftJoin(schema.vehiculos, sql`${schema.vehiculos.id} = ${schema.ordenes.vehiculoId}`)
    .where(and(
      eq(schema.ordenes.tenantId, me.tenantId),
      gte(schema.ordenes.fechaIngreso, desde),
      lte(schema.ordenes.fechaIngreso, hasta),
    ))
    .orderBy(desc(schema.ordenes.fechaIngreso));

  const headers = [
    'Comprobante','Fecha','Cliente','DNI','Dominio','Marca','Modelo',
    'Estado','Pago','Bruto','Neto','IVA','Repuestos','ManoObra','Efectivo','OtroMonto',
  ];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const o of ordenes) {
    lines.push([
      o.comprobante,
      new Date(o.fechaIngreso).toISOString().slice(0, 10),
      o.clienteNombre, o.clienteDni,
      o.vehDominio, o.vehMarca, o.vehModelo,
      o.estado, o.pagoEstado,
      o.totalBruto, o.totalNeto, o.totalIva, o.totalRepuestos, o.totalManoObra,
      o.pagoEfectivo, o.pagoOtroMonto,
    ].map(escape).join(','));
  }
  const csv = lines.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="informe-${desde.toISOString().slice(0,10)}-${hasta.toISOString().slice(0,10)}.csv"`,
    },
  });
}
