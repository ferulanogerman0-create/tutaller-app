import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { recalcularTotales } from '@/lib/actions/ordenes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Action =
  | 'dashboard'
  | 'searchClientes' | 'createCliente' | 'updateCliente'
  | 'searchVehiculos' | 'createVehiculo' | 'updateVehiculo'
  | 'searchInventario' | 'createInventarioItem' | 'updateInventarioItem' | 'ajustarStock'
  | 'createOrden' | 'getOrden' | 'getOrdenByComprobante' | 'listOrdenes' | 'getEntregasHoy' | 'setEstado' | 'updateOrden'
  | 'addItem' | 'updateItem' | 'removeItem'
  | 'registrarPago'
  | 'createRecordatorio' | 'listRecordatorios' | 'completarRecordatorio'
  | 'kpiPeriodo'
  | 'getClienteOrdenes' | 'getVehiculoInfo'
  | 'createMovimientoCaja' | 'listMovimientosCaja' | 'saldoCajaHoy'
  | 'searchProveedores' | 'createProveedor' | 'updateProveedor'
  | 'listTrabajadores' | 'asignarMecanicoOrden'
  | 'createTurno' | 'listTurnos' | 'setEstadoTurno';

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

async function nextComprobante(tenantId: number) {
  const last = await db.select({ id: schema.ordenes.id })
    .from(schema.ordenes)
    .where(eq(schema.ordenes.tenantId, tenantId))
    .orderBy(desc(schema.ordenes.id)).limit(1);
  const next = (last[0]?.id || 0) + 1;
  return `OR-${String(next).padStart(6, '0')}`;
}

// Resolve tenant from request — Bearer token in Authorization header OR X-Tenant-Id + Bearer
async function resolveTenant(req: Request): Promise<{ tenantId: number; tenant: typeof schema.tenants.$inferSelect } | { error: NextResponse }> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  const xTenantId = req.headers.get('x-tenant-id');

  if (xTenantId && bearer) {
    const tid = Number(xTenantId);
    if (!tid) return { error: NextResponse.json({ error: 'invalid x-tenant-id' }, { status: 400 }) };
    const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tid)).limit(1);
    const t = rows[0];
    if (!t || !t.activo) return { error: NextResponse.json({ error: 'tenant not found or inactive' }, { status: 403 }) };
    if (t.botToken !== bearer) return { error: NextResponse.json({ error: 'invalid bot token' }, { status: 403 }) };
    if (t.plan !== 'bot' && t.plan !== 'enterprise') return { error: NextResponse.json({ error: 'plan does not include bot', plan: t.plan }, { status: 403 }) };
    return { tenantId: t.id, tenant: t };
  }

  if (bearer) {
    const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.botToken, bearer)).limit(1);
    const t = rows[0];
    if (!t || !t.activo) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
    if (t.plan !== 'bot' && t.plan !== 'enterprise') return { error: NextResponse.json({ error: 'plan does not include bot', plan: t.plan }, { status: 403 }) };
    return { tenantId: t.id, tenant: t };
  }

  return { error: NextResponse.json({ error: 'no auth' }, { status: 401 }) };
}

export async function POST(req: Request) {
  const auth = await resolveTenant(req);
  if ('error' in auth) return auth.error;
  const { tenantId } = auth;

  const body = await req.json().catch(() => ({}));
  const action = body.action as Action;
  const p = body.params || {};

  try {
    switch (action) {
      case 'dashboard': {
        const todayStart = startOfDay();
        const todayEnd = endOfDay();
        const weekStart = startOfDay(addDays(new Date(), -6));
        const monthStart = startOfDay(addDays(new Date(), -29));
        const sumOrdenes = async (from: Date, to: Date) => {
          const rows = await db.select({
            count: sql<number>`COUNT(*)::int`,
            bruto: sql<number>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)::float`,
            pagado: sql<number>`COALESCE(SUM(CAST(${schema.ordenes.pagoEfectivo} AS NUMERIC) + CAST(${schema.ordenes.pagoOtroMonto} AS NUMERIC)), 0)::float`,
          }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tenantId), gte(schema.ordenes.fechaIngreso, from), lte(schema.ordenes.fechaIngreso, to)));
          return rows[0];
        };
        const hoy = await sumOrdenes(todayStart, todayEnd);
        const semana = await sumOrdenes(weekStart, todayEnd);
        const mes = await sumOrdenes(monthStart, todayEnd);
        const enCurso = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tenantId), sql`${schema.ordenes.estado} NOT IN ('entregado')`));
        const pendientesEntrega = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tenantId), eq(schema.ordenes.estado, 'reparado')));
        return NextResponse.json({ hoy, semana, mes, enCurso: enCurso[0]?.count || 0, pendientesEntrega: pendientesEntrega[0]?.count || 0 });
      }

      case 'searchClientes': {
        const q = String(p.q || '').trim();
        if (!q) return NextResponse.json({ results: [] });
        const rows = await db.select().from(schema.clientes).where(and(eq(schema.clientes.tenantId, tenantId), or(
          ilike(schema.clientes.nombre, `%${q}%`),
          ilike(schema.clientes.dni, `%${q}%`),
          ilike(schema.clientes.telefono, `%${q}%`),
        ))).limit(10);
        return NextResponse.json({ results: rows });
      }

      case 'createCliente': {
        const [c] = await db.insert(schema.clientes).values({
          tenantId,
          nombre: String(p.nombre || '').trim(),
          dni: p.dni || null, telefono: p.telefono || null, telefonoAlt: p.telefonoAlt || null,
          email: p.email || null, domicilio: p.domicilio || null, localidad: p.localidad || null,
        }).returning();
        return NextResponse.json({ cliente: c });
      }

      case 'updateCliente': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const patch: Record<string, unknown> = {};
        for (const k of ['nombre','nombreFantasia','tipoDocumento','dni','cuit','domicilio','localidad','tipoResponsable','telefono','telefonoAlt','email','emailAlt','contacto','comentario']) {
          if (p[k] !== undefined) patch[k] = p[k];
        }
        if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
        patch.updatedAt = new Date();
        await db.update(schema.clientes).set(patch as never).where(and(eq(schema.clientes.id, id), eq(schema.clientes.tenantId, tenantId)));
        const [c] = await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, id), eq(schema.clientes.tenantId, tenantId)));
        return NextResponse.json({ cliente: c });
      }

      case 'searchVehiculos': {
        const q = String(p.q || '').trim();
        const conds = [eq(schema.vehiculos.tenantId, tenantId)];
        if (p.clienteId) conds.push(eq(schema.vehiculos.clienteId, Number(p.clienteId)));
        else if (q) conds.push(or(ilike(schema.vehiculos.dominio, `%${q}%`), ilike(schema.vehiculos.marca, `%${q}%`), ilike(schema.vehiculos.modelo, `%${q}%`))!);
        const rows = await db.select().from(schema.vehiculos).where(and(...conds)).limit(10);
        return NextResponse.json({ results: rows });
      }

      case 'createVehiculo': {
        const [v] = await db.insert(schema.vehiculos).values({
          tenantId,
          clienteId: p.clienteId ? Number(p.clienteId) : null,
          dominio: String(p.dominio || '').toUpperCase(), marca: p.marca || null, modelo: p.modelo || null,
          anio: p.anio || null, color: p.color || null, tipo: p.tipo || null,
          kilometraje: p.kilometraje || null, chasis: p.chasis || null,
        }).returning();
        return NextResponse.json({ vehiculo: v });
      }

      case 'updateVehiculo': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const patch: Record<string, unknown> = {};
        for (const k of ['dominio','marca','modelo','tipo','color','anio','kilometraje','combustible','motor','chasis','comentario','clienteId']) {
          if (p[k] !== undefined) patch[k] = k === 'dominio' ? String(p[k]).toUpperCase() : p[k];
        }
        if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
        await db.update(schema.vehiculos).set(patch as never).where(and(eq(schema.vehiculos.id, id), eq(schema.vehiculos.tenantId, tenantId)));
        const [v] = await db.select().from(schema.vehiculos).where(and(eq(schema.vehiculos.id, id), eq(schema.vehiculos.tenantId, tenantId)));
        return NextResponse.json({ vehiculo: v });
      }

      case 'searchInventario': {
        const q = String(p.q || '').trim();
        if (!q) return NextResponse.json({ results: [] });
        const rows = await db.select().from(schema.inventarioItems).where(and(eq(schema.inventarioItems.tenantId, tenantId), or(
          ilike(schema.inventarioItems.nombre, `%${q}%`),
          ilike(schema.inventarioItems.codigo, `%${q}%`),
        ))).limit(10);
        return NextResponse.json({ results: rows });
      }

      case 'createInventarioItem': {
        const [it] = await db.insert(schema.inventarioItems).values({
          tenantId,
          codigo: p.codigo || null,
          nombre: String(p.nombre || '').trim(),
          tipo: (p.tipo as 'servicio'|'repuesto') || 'repuesto',
          precio: String(Number(p.precio || 0)),
          categoria: p.categoria || null,
          stock: p.stock !== undefined ? Number(p.stock) : null,
          stockMinimo: p.stockMinimo !== undefined ? Number(p.stockMinimo) : 0,
          unidadMedida: p.unidadMedida || 'UNIDAD',
          ivaPct: String(Number(p.ivaPct ?? 0)),
        }).returning();
        return NextResponse.json({ item: it });
      }

      case 'updateInventarioItem': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const patch: Record<string, unknown> = {};
        for (const k of ['codigo','nombre','tipo','categoria','unidadMedida','activo','stockMinimo']) {
          if (p[k] !== undefined) patch[k] = p[k];
        }
        if (p.precio !== undefined) patch.precio = String(Number(p.precio));
        if (p.ivaPct !== undefined) patch.ivaPct = String(Number(p.ivaPct));
        if (p.stock !== undefined) patch.stock = Number(p.stock);
        if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
        await db.update(schema.inventarioItems).set(patch as never).where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, tenantId)));
        const [it] = await db.select().from(schema.inventarioItems).where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, tenantId)));
        return NextResponse.json({ item: it });
      }

      case 'ajustarStock': {
        const id = Number(p.id);
        const delta = Number(p.delta);
        if (!id || !Number.isFinite(delta)) return NextResponse.json({ error: 'id+delta required' }, { status: 400 });
        const [existing] = await db.select().from(schema.inventarioItems).where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, tenantId)));
        if (!existing) return NextResponse.json({ error: 'item not found' }, { status: 404 });
        const nuevo = (existing.stock ?? 0) + delta;
        await db.update(schema.inventarioItems).set({ stock: nuevo }).where(and(eq(schema.inventarioItems.id, id), eq(schema.inventarioItems.tenantId, tenantId)));
        return NextResponse.json({ id, stockAnterior: existing.stock ?? 0, delta, stockNuevo: nuevo });
      }

      case 'createOrden': {
        const comprobante = await nextComprobante(tenantId);
        const [o] = await db.insert(schema.ordenes).values({
          tenantId,
          comprobante,
          clienteId: p.clienteId ? Number(p.clienteId) : null,
          vehiculoId: p.vehiculoId ? Number(p.vehiculoId) : null,
          tecnicoId: p.tecnicoId ? Number(p.tecnicoId) : null,
          estado: (p.estado as 'ingresado'|'diagnostico'|'en_reparacion'|'reparado'|'entregado') || 'ingresado',
          concepto: (p.concepto as 'REPARACION'|'SERVICE'|'MANTENIMIENTO'|'REVISION'|'GARANTIA'|'OTRO') || 'REPARACION',
          observaciones: p.observaciones || null,
          comentarioInterno: p.comentarioInterno || null,
          kilometraje: p.kilometraje || null,
          combustible: p.combustible || null,
        }).returning();
        return NextResponse.json({ orden: o });
      }

      case 'getOrden': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const rows = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId))).limit(1);
        if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
        const items = await db.select().from(schema.ordenItems).where(and(eq(schema.ordenItems.ordenId, id), eq(schema.ordenItems.tenantId, tenantId)));
        const cliente = rows[0].clienteId ? (await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, rows[0].clienteId), eq(schema.clientes.tenantId, tenantId))).limit(1))[0] : null;
        const vehiculo = rows[0].vehiculoId ? (await db.select().from(schema.vehiculos).where(and(eq(schema.vehiculos.id, rows[0].vehiculoId), eq(schema.vehiculos.tenantId, tenantId))).limit(1))[0] : null;
        return NextResponse.json({ orden: rows[0], items, cliente, vehiculo });
      }

      case 'getOrdenByComprobante': {
        const comp = String(p.comprobante || '').trim();
        if (!comp) return NextResponse.json({ error: 'comprobante required' }, { status: 400 });
        const rows = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tenantId), ilike(schema.ordenes.comprobante, `%${comp}%`))).limit(5);
        if (!rows[0]) return NextResponse.json({ error: 'not found', q: comp });
        const o = rows[0];
        const items = await db.select().from(schema.ordenItems).where(and(eq(schema.ordenItems.ordenId, o.id), eq(schema.ordenItems.tenantId, tenantId)));
        const cliente = o.clienteId ? (await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, o.clienteId), eq(schema.clientes.tenantId, tenantId))).limit(1))[0] : null;
        const vehiculo = o.vehiculoId ? (await db.select().from(schema.vehiculos).where(and(eq(schema.vehiculos.id, o.vehiculoId), eq(schema.vehiculos.tenantId, tenantId))).limit(1))[0] : null;
        return NextResponse.json({ orden: o, items, cliente, vehiculo, matches: rows.length });
      }

      case 'listOrdenes': {
        const estado = p.estado as string | undefined;
        const conds = [eq(schema.ordenes.tenantId, tenantId)];
        if (estado) conds.push(eq(schema.ordenes.estado, estado as never));
        const rows = await db.select().from(schema.ordenes).where(and(...conds)).orderBy(desc(schema.ordenes.id)).limit(p.limit || 20);
        return NextResponse.json({ results: rows });
      }

      case 'getEntregasHoy': {
        const hoyArg = sql`(NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`;
        const rows = await db.select().from(schema.ordenes).where(
          and(
            eq(schema.ordenes.tenantId, tenantId),
            eq(schema.ordenes.estado, 'entregado'),
            sql`(
              (${schema.ordenes.fechaEgreso} IS NOT NULL AND DATE(${schema.ordenes.fechaEgreso} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${hoyArg})
              OR
              (${schema.ordenes.fechaEgreso} IS NULL AND DATE(${schema.ordenes.updatedAt} AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${hoyArg} AND ${schema.ordenes.fechaIngreso} >= NOW() - INTERVAL '2 days')
            )`
          )
        ).orderBy(desc(schema.ordenes.updatedAt));
        const results = await Promise.all(rows.map(async (o) => {
          const cliente = o.clienteId ? (await db.select({ nombre: schema.clientes.nombre }).from(schema.clientes).where(and(eq(schema.clientes.id, o.clienteId), eq(schema.clientes.tenantId, tenantId))).limit(1))[0] : null;
          const vehiculo = o.vehiculoId ? (await db.select({ dominio: schema.vehiculos.dominio, marca: schema.vehiculos.marca, modelo: schema.vehiculos.modelo }).from(schema.vehiculos).where(and(eq(schema.vehiculos.id, o.vehiculoId), eq(schema.vehiculos.tenantId, tenantId))).limit(1))[0] : null;
          return { ...o, clienteNombre: cliente?.nombre ?? null, vehiculoDominio: vehiculo?.dominio ?? null, vehiculoMarca: vehiculo?.marca ?? null, vehiculoModelo: vehiculo?.modelo ?? null };
        }));
        return NextResponse.json({ results, total: results.length });
      }

      case 'setEstado': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await db.update(schema.ordenes).set({
          estado: p.estado, updatedAt: new Date(),
          ...(p.estado === 'entregado' ? { fechaEgreso: new Date() } : {}),
        }).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId)));
        return NextResponse.json({ ok: true });
      }

      case 'updateOrden': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const patch: Record<string, unknown> = {};
        for (const k of ['concepto','combustible','kilometraje','categoria','observaciones','comentarioInterno','tecnicoId','clienteId','vehiculoId']) {
          if (p[k] !== undefined) patch[k] = p[k];
        }
        if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
        patch.updatedAt = new Date();
        await db.update(schema.ordenes).set(patch as never).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId)));
        const [o] = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId)));
        return NextResponse.json({ orden: o });
      }

      case 'addItem': {
        const ordenId = Number(p.ordenId);
        if (!ordenId) return NextResponse.json({ error: 'ordenId required' }, { status: 400 });
        const [own] = await db.select({ id: schema.ordenes.id }).from(schema.ordenes).where(and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId))).limit(1);
        if (!own) return NextResponse.json({ error: 'orden not in tenant scope' }, { status: 404 });
        const importe = Number(p.importe || 0);
        const cantidad = Number(p.cantidad || 1);
        const bonif = Number(p.bonificacionPct || 0);
        const iva = Number(p.ivaPct ?? 0);
        const subtotal = importe * cantidad * (1 - bonif / 100);
        const [it] = await db.insert(schema.ordenItems).values({
          tenantId,
          ordenId, nombre: String(p.nombre || '').trim(),
          tipo: (p.tipo as 'servicio'|'repuesto') || 'servicio',
          importe: String(importe), cantidad: String(cantidad),
          bonificacionPct: String(bonif), ivaPct: String(iva),
          subtotal: String(subtotal),
          inventarioItemId: p.inventarioItemId || null,
        }).returning();
        await recalcularTotales(ordenId, tenantId);
        return NextResponse.json({ item: it });
      }

      case 'updateItem': {
        const itemId = Number(p.itemId);
        if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });
        const [existing] = await db.select().from(schema.ordenItems).where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, tenantId)));
        if (!existing) return NextResponse.json({ error: 'item not found' }, { status: 404 });
        const importe = p.importe !== undefined ? Number(p.importe) : Number(existing.importe);
        const cantidad = p.cantidad !== undefined ? Number(p.cantidad) : Number(existing.cantidad);
        const bonif = p.bonificacionPct !== undefined ? Number(p.bonificacionPct) : Number(existing.bonificacionPct);
        const iva = p.ivaPct !== undefined ? Number(p.ivaPct) : Number(existing.ivaPct);
        const subtotal = importe * cantidad * (1 - bonif / 100);
        const patch: Record<string, unknown> = {
          importe: String(importe), cantidad: String(cantidad),
          bonificacionPct: String(bonif), ivaPct: String(iva), subtotal: String(subtotal),
        };
        if (p.nombre !== undefined) patch.nombre = String(p.nombre);
        if (p.tipo !== undefined) patch.tipo = p.tipo;
        await db.update(schema.ordenItems).set(patch as never).where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, tenantId)));
        await recalcularTotales(existing.ordenId, tenantId);
        const [updated] = await db.select().from(schema.ordenItems).where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, tenantId)));
        return NextResponse.json({ item: updated });
      }

      case 'removeItem': {
        const itemId = Number(p.itemId);
        const ordenId = Number(p.ordenId);
        if (!itemId || !ordenId) return NextResponse.json({ error: 'itemId+ordenId required' }, { status: 400 });
        await db.delete(schema.ordenItems).where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, tenantId)));
        await recalcularTotales(ordenId, tenantId);
        return NextResponse.json({ ok: true });
      }

      case 'registrarPago': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const efectivo = Number(p.efectivo || 0);
        const otroMonto = Number(p.otroMonto || 0);
        const totalRow = await db.select({ totalBruto: schema.ordenes.totalBruto }).from(schema.ordenes).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId))).limit(1);
        const totalBruto = Number(totalRow[0]?.totalBruto || 0);
        const pagado = efectivo + otroMonto;
        const pagoEstado: 'pagado'|'parcial'|'pendiente' = pagado >= totalBruto - 0.01 ? 'pagado' : pagado > 0 ? 'parcial' : 'pendiente';
        await db.update(schema.ordenes).set({
          pagoEfectivo: String(efectivo), pagoOtroMonto: String(otroMonto),
          pagoOtroMedio: p.otroMedio || null, pagoEstado, updatedAt: new Date(),
        }).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, tenantId)));
        return NextResponse.json({ ok: true, pagoEstado, totalBruto, pagado });
      }

      case 'createRecordatorio': {
        const fecha = p.fechaProgramada ? new Date(p.fechaProgramada) : addDays(new Date(), Number(p.diasEnFuturo || 7));
        const [r] = await db.insert(schema.recordatorios).values({
          tenantId,
          tipo: p.tipo || 'service', titulo: p.titulo, detalle: p.detalle || null,
          clienteId: p.clienteId || null, vehiculoId: p.vehiculoId || null, ordenId: p.ordenId || null,
          fechaProgramada: fecha, kilometrajeProgramado: p.kilometrajeProgramado || null,
          estado: 'pendiente',
        }).returning();
        return NextResponse.json({ recordatorio: r });
      }

      case 'listRecordatorios': {
        const estado = (p.estado as 'pendiente'|'enviado'|'completado'|'cancelado'|undefined);
        const proximosDias = p.proximosDias !== undefined ? Number(p.proximosDias) : null;
        const conds: unknown[] = [eq(schema.recordatorios.tenantId, tenantId)];
        if (estado) conds.push(eq(schema.recordatorios.estado, estado));
        if (proximosDias !== null) {
          conds.push(gte(schema.recordatorios.fechaProgramada, startOfDay()));
          conds.push(lte(schema.recordatorios.fechaProgramada, endOfDay(addDays(new Date(), proximosDias))));
        }
        const rows = await db.select().from(schema.recordatorios).where(and(...(conds as never[]))).orderBy(schema.recordatorios.fechaProgramada).limit(p.limit || 50);
        return NextResponse.json({ count: rows.length, results: rows });
      }

      case 'completarRecordatorio': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await db.update(schema.recordatorios).set({
          estado: (p.estado as 'completado'|'cancelado') || 'completado',
          completadoAt: new Date(),
        }).where(and(eq(schema.recordatorios.id, id), eq(schema.recordatorios.tenantId, tenantId)));
        return NextResponse.json({ ok: true, id });
      }

      case 'getClienteOrdenes': {
        const clienteId = Number(p.clienteId);
        if (!clienteId) return NextResponse.json({ error: 'clienteId required' }, { status: 400 });
        const ordenes = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.clienteId, clienteId), eq(schema.ordenes.tenantId, tenantId))).orderBy(desc(schema.ordenes.id)).limit(20);
        const totalDeuda = ordenes.reduce((sum, o) => sum + Math.max(0, Number(o.totalBruto) - Number(o.pagoEfectivo) - Number(o.pagoOtroMonto)), 0);
        return NextResponse.json({ ordenes, count: ordenes.length, totalDeuda });
      }

      case 'getVehiculoInfo': {
        const dominio = String(p.dominio || '').trim().toUpperCase();
        if (!dominio) return NextResponse.json({ error: 'dominio required' }, { status: 400 });
        const v = (await db.select().from(schema.vehiculos).where(and(eq(schema.vehiculos.tenantId, tenantId), ilike(schema.vehiculos.dominio, `%${dominio}%`))).limit(1))[0];
        if (!v) return NextResponse.json({ error: 'not found', q: dominio });
        const clienteRegistrado = v.clienteId ? (await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, v.clienteId), eq(schema.clientes.tenantId, tenantId))).limit(1))[0] : null;
        const ordenes = await db.select().from(schema.ordenes).where(and(eq(schema.ordenes.vehiculoId, v.id), eq(schema.ordenes.tenantId, tenantId))).orderBy(desc(schema.ordenes.id)).limit(5);
        let clienteUltimaOrden = null;
        if (ordenes[0]?.clienteId) {
          clienteUltimaOrden = (await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, ordenes[0].clienteId), eq(schema.clientes.tenantId, tenantId))).limit(1))[0] || null;
        }
        return NextResponse.json({
          vehiculo: v, clienteRegistrado, clienteUltimaOrden, ultimasOrdenes: ordenes,
          nota: clienteRegistrado && clienteUltimaOrden && clienteRegistrado.id !== clienteUltimaOrden.id
            ? 'Cliente registrado en tabla vehiculos difiere del cliente de la última orden.'
            : undefined,
        });
      }

      case 'kpiPeriodo': {
        const from = new Date(p.from);
        const to = new Date(p.to);
        const rows = await db.select({
          count: sql<number>`COUNT(*)::int`,
          bruto: sql<number>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)::float`,
          pagado: sql<number>`COALESCE(SUM(CAST(${schema.ordenes.pagoEfectivo} AS NUMERIC) + CAST(${schema.ordenes.pagoOtroMonto} AS NUMERIC)), 0)::float`,
        }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tenantId), gte(schema.ordenes.fechaIngreso, from), lte(schema.ordenes.fechaIngreso, to)));
        return NextResponse.json({ from, to, ...rows[0] });
      }

      case 'createMovimientoCaja': {
        const tipo = (p.tipo as 'ingreso'|'egreso') || 'egreso';
        const efectivo = Number(p.efectivo || 0);
        const otroMonto = Number(p.otroMonto || 0);
        const total = efectivo + otroMonto;
        if (!p.detalle) return NextResponse.json({ error: 'detalle required' }, { status: 400 });
        const [m] = await db.insert(schema.cajaMovimientos).values({
          tenantId,
          tipo, detalle: String(p.detalle).trim(),
          efectivo: String(efectivo), otroMonto: String(otroMonto),
          otroMedio: p.otroMedio || null, total: String(total),
          categoria: p.categoria || null, origen: p.origen || 'whatsapp_bot',
          vehiculo: p.vehiculo || null, proveedor: p.proveedor || null, clienteRef: p.clienteRef || null,
          fechaMovimiento: p.fechaMovimiento ? new Date(p.fechaMovimiento) : new Date(),
          ordenId: p.ordenId ? Number(p.ordenId) : null,
        }).returning();
        return NextResponse.json({ movimiento: m });
      }

      case 'listMovimientosCaja': {
        const from = p.from ? new Date(p.from) : startOfDay();
        const to = p.to ? new Date(p.to) : endOfDay();
        const tipo = p.tipo as 'ingreso'|'egreso'|undefined;
        const conds = [eq(schema.cajaMovimientos.tenantId, tenantId), gte(schema.cajaMovimientos.createdAt, from), lte(schema.cajaMovimientos.createdAt, to)];
        if (tipo) conds.push(eq(schema.cajaMovimientos.tipo, tipo));
        const rows = await db.select().from(schema.cajaMovimientos).where(and(...conds)).orderBy(desc(schema.cajaMovimientos.createdAt)).limit(p.limit || 50);
        return NextResponse.json({ from, to, count: rows.length, results: rows });
      }

      case 'saldoCajaHoy': {
        const from = p.from ? new Date(p.from) : startOfDay();
        const to = p.to ? new Date(p.to) : endOfDay();
        const sumRow = await db.select({
          ingresos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cajaMovimientos.tipo} = 'ingreso' THEN CAST(${schema.cajaMovimientos.total} AS NUMERIC) ELSE 0 END), 0)::float`,
          egresos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cajaMovimientos.tipo} = 'egreso' THEN CAST(${schema.cajaMovimientos.total} AS NUMERIC) ELSE 0 END), 0)::float`,
          efectivoIn: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cajaMovimientos.tipo} = 'ingreso' THEN CAST(${schema.cajaMovimientos.efectivo} AS NUMERIC) ELSE 0 END), 0)::float`,
          efectivoOut: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cajaMovimientos.tipo} = 'egreso' THEN CAST(${schema.cajaMovimientos.efectivo} AS NUMERIC) ELSE 0 END), 0)::float`,
        }).from(schema.cajaMovimientos).where(and(eq(schema.cajaMovimientos.tenantId, tenantId), gte(schema.cajaMovimientos.createdAt, from), lte(schema.cajaMovimientos.createdAt, to)));
        const r = sumRow[0];
        return NextResponse.json({ from, to, ingresos: r.ingresos, egresos: r.egresos, saldo: r.ingresos - r.egresos, efectivoNeto: r.efectivoIn - r.efectivoOut });
      }

      case 'searchProveedores': {
        const q = String(p.q || '').trim();
        const conds = [eq(schema.proveedores.tenantId, tenantId)];
        if (q) conds.push(or(ilike(schema.proveedores.nombre, `%${q}%`), ilike(schema.proveedores.cuit, `%${q}%`), ilike(schema.proveedores.rubro, `%${q}%`))!);
        const rows = await db.select().from(schema.proveedores).where(and(...conds)).limit(20);
        return NextResponse.json({ results: rows });
      }

      case 'createProveedor': {
        const [pr] = await db.insert(schema.proveedores).values({
          tenantId,
          nombre: String(p.nombre || '').trim(),
          cuit: p.cuit || null, telefono: p.telefono || null, email: p.email || null,
          direccion: p.direccion || null, rubro: p.rubro || null, comentario: p.comentario || null,
        }).returning();
        return NextResponse.json({ proveedor: pr });
      }

      case 'updateProveedor': {
        const id = Number(p.id);
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const patch: Record<string, unknown> = {};
        for (const k of ['nombre','cuit','telefono','email','direccion','rubro','comentario','activo']) {
          if (p[k] !== undefined) patch[k] = p[k];
        }
        if (p.saldo !== undefined) patch.saldo = String(Number(p.saldo));
        if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
        await db.update(schema.proveedores).set(patch as never).where(and(eq(schema.proveedores.id, id), eq(schema.proveedores.tenantId, tenantId)));
        const [pr] = await db.select().from(schema.proveedores).where(and(eq(schema.proveedores.id, id), eq(schema.proveedores.tenantId, tenantId)));
        return NextResponse.json({ proveedor: pr });
      }

      case 'listTrabajadores': {
        const rows = await db.select({
          id: schema.users.id, username: schema.users.username, nombre: schema.users.nombre,
          role: schema.users.role, activo: schema.users.activo,
        }).from(schema.users).where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.activo, true)));
        return NextResponse.json({ results: rows });
      }

      case 'asignarMecanicoOrden': {
        const ordenId = Number(p.ordenId);
        const tecnicoId = p.tecnicoId === null ? null : Number(p.tecnicoId);
        if (!ordenId) return NextResponse.json({ error: 'ordenId required' }, { status: 400 });
        await db.update(schema.ordenes).set({ tecnicoId, updatedAt: new Date() }).where(and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId)));
        return NextResponse.json({ ok: true, ordenId, tecnicoId });
      }

      case 'createTurno': {
        if (!p.titulo || !p.fechaInicio) return NextResponse.json({ error: 'titulo+fechaInicio required' }, { status: 400 });
        const [t] = await db.insert(schema.turnos).values({
          tenantId,
          titulo: String(p.titulo).trim(),
          detalle: p.detalle || null,
          clienteId: p.clienteId ? Number(p.clienteId) : null,
          vehiculoId: p.vehiculoId ? Number(p.vehiculoId) : null,
          tecnicoId: p.tecnicoId ? Number(p.tecnicoId) : null,
          ordenId: p.ordenId ? Number(p.ordenId) : null,
          fechaInicio: new Date(p.fechaInicio),
          fechaFin: p.fechaFin ? new Date(p.fechaFin) : null,
          estado: p.estado || 'agendado',
        }).returning();
        return NextResponse.json({ turno: t });
      }

      case 'listTurnos': {
        const from = p.from ? new Date(p.from) : startOfDay();
        const to = p.to ? new Date(p.to) : endOfDay(addDays(new Date(), 7));
        const estado = p.estado as string | undefined;
        const conds: unknown[] = [eq(schema.turnos.tenantId, tenantId), gte(schema.turnos.fechaInicio, from), lte(schema.turnos.fechaInicio, to)];
        if (estado) conds.push(eq(schema.turnos.estado, estado as never));
        const rows = await db.select().from(schema.turnos).where(and(...(conds as never[]))).orderBy(schema.turnos.fechaInicio).limit(p.limit || 50);
        return NextResponse.json({ from, to, count: rows.length, results: rows });
      }

      case 'setEstadoTurno': {
        const id = Number(p.id);
        if (!id || !p.estado) return NextResponse.json({ error: 'id+estado required' }, { status: 400 });
        await db.update(schema.turnos).set({ estado: p.estado }).where(and(eq(schema.turnos.id, id), eq(schema.turnos.tenantId, tenantId)));
        return NextResponse.json({ ok: true, id, estado: p.estado });
      }

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
