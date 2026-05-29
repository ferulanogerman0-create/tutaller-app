'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx, getSlug } from './_ctx';
import { notificar } from '@/lib/notificar';
import { getConfig } from '@/lib/actions/config';
import { audit } from '@/lib/audit';

function generateComprobante(id: number) {
  return `0001-${String(id).padStart(8, '0')}`;
}

export async function listOrdenes(filters?: { estado?: string; q?: string }) {
  const u = await ctx();
  const conds: ReturnType<typeof eq>[] = [
    eq(schema.ordenes.tenantId, u.tenantId),
    eq(schema.ordenes.esPresupuesto, false),
  ];
  if (filters?.estado && filters.estado !== 'todos') {
    conds.push(eq(schema.ordenes.estado, filters.estado as 'ingresado'|'diagnostico'|'en_reparacion'|'reparado'|'entregado'));
  }
  return await db.select({
    orden: schema.ordenes,
    cliente: schema.clientes,
    vehiculo: schema.vehiculos,
  }).from(schema.ordenes)
    .leftJoin(schema.clientes, eq(schema.ordenes.clienteId, schema.clientes.id))
    .leftJoin(schema.vehiculos, eq(schema.ordenes.vehiculoId, schema.vehiculos.id))
    .where(and(...conds))
    .orderBy(desc(schema.ordenes.fechaIngreso))
    .limit(100);
}

export async function getOrden(id: number) {
  const u = await ctx();
  const rows = await db.select({
    orden: schema.ordenes,
    cliente: schema.clientes,
    vehiculo: schema.vehiculos,
    tecnico: schema.users,
  }).from(schema.ordenes)
    .leftJoin(schema.clientes, eq(schema.ordenes.clienteId, schema.clientes.id))
    .leftJoin(schema.vehiculos, eq(schema.ordenes.vehiculoId, schema.vehiculos.id))
    .leftJoin(schema.users, eq(schema.ordenes.tecnicoId, schema.users.id))
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)))
    .limit(1);
  if (!rows[0]) return null;
  const items = await db.select().from(schema.ordenItems)
    .where(and(eq(schema.ordenItems.ordenId, id), eq(schema.ordenItems.tenantId, u.tenantId)))
    .orderBy(schema.ordenItems.orden);
  return { ...rows[0], items };
}

function calcPagoEstado(totalBruto: number, totalPagado: number): 'pagado' | 'parcial' | 'pendiente' {
  if (totalBruto <= 0) return 'pendiente';
  if (totalPagado >= totalBruto - 0.01) return 'pagado';
  if (totalPagado > 0) return 'parcial';
  return 'pendiente';
}

export async function sincronizarMovimientoCajaOrden(ordenId: number, tenantId: number, userId?: number | null) {
  const o = await db.query.ordenes.findFirst({
    where: and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId)),
    with: { cliente: true, vehiculo: true },
  });
  if (!o) return null;
  if (o.estado !== 'entregado' && o.pagoEstado !== 'pagado' && o.pagoEstado !== 'parcial') return null;

  const efectivo = Number(o.pagoEfectivo || 0);
  const otroMonto = Number(o.pagoOtroMonto || 0);
  const total = efectivo + otroMonto;
  if (total <= 0) return null;

  const detalle = `Orden ${o.comprobante}${o.vehiculo?.dominio ? ` · ${o.vehiculo.dominio}` : ''}${o.cliente?.nombre ? ` · ${o.cliente.nombre}` : ''}`;
  const values = {
    tenantId,
    tipo: 'ingreso' as const,
    detalle,
    efectivo: String(efectivo),
    otroMedio: o.pagoOtroMedio,
    otroMonto: String(otroMonto),
    total: String(total),
    categoria: 'Reparación',
    origen: 'orden',
    vehiculo: o.vehiculo?.dominio || null,
    clienteRef: o.cliente?.nombre || null,
    fechaMovimiento: o.fechaEgreso || o.updatedAt || new Date(),
    ordenId: o.id,
    createdBy: userId || null,
  };

  const existing = await db.select({ id: schema.cajaMovimientos.id })
    .from(schema.cajaMovimientos)
    .where(and(eq(schema.cajaMovimientos.ordenId, ordenId), eq(schema.cajaMovimientos.tenantId, tenantId)))
    .limit(1);

  if (existing[0]) {
    await db.update(schema.cajaMovimientos).set(values)
      .where(and(eq(schema.cajaMovimientos.id, existing[0].id), eq(schema.cajaMovimientos.tenantId, tenantId)));
    return { action: 'updated', id: existing[0].id };
  }
  const [ins] = await db.insert(schema.cajaMovimientos).values(values).returning({ id: schema.cajaMovimientos.id });
  return { action: 'inserted', id: ins.id };
}

export async function recalcularTotales(ordenId: number, tenantId: number) {
  const items = await db.select().from(schema.ordenItems)
    .where(and(eq(schema.ordenItems.ordenId, ordenId), eq(schema.ordenItems.tenantId, tenantId)));
  let totalRepuestos = 0, totalManoObra = 0, totalIva = 0;
  for (const it of items) {
    const sub = Number(it.subtotal);
    const iva = sub * (Number(it.ivaPct) / 100);
    if (it.tipo === 'repuesto') totalRepuestos += sub;
    else totalManoObra += sub;
    totalIva += iva;
  }
  const totalNeto = totalRepuestos + totalManoObra;
  const totalBruto = totalNeto + totalIva;
  const orden = await db.select({
    pagoEfectivo: schema.ordenes.pagoEfectivo,
    pagoOtroMonto: schema.ordenes.pagoOtroMonto,
  }).from(schema.ordenes)
    .where(and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId)))
    .limit(1);
  const pagado = Number(orden[0]?.pagoEfectivo || 0) + Number(orden[0]?.pagoOtroMonto || 0);
  const pagoEstado = calcPagoEstado(totalBruto, pagado);
  await db.update(schema.ordenes).set({
    totalRepuestos: String(totalRepuestos),
    totalManoObra: String(totalManoObra),
    totalNeto: String(totalNeto),
    totalIva: String(totalIva),
    totalBruto: String(totalBruto),
    pagoEstado,
    updatedAt: new Date(),
  }).where(and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId)));
}

export async function createOrden(formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const clienteId = Number(formData.get('cliente_id'));
  const vehiculoId = Number(formData.get('vehiculo_id'));
  if (!clienteId || !vehiculoId) throw new Error('Cliente y vehículo requeridos');

  const [row] = await db.insert(schema.ordenes).values({
    tenantId: u.tenantId,
    comprobante: 'tmp',
    clienteId,
    vehiculoId,
    tecnicoId: formData.get('tecnico_id') ? Number(formData.get('tecnico_id')) : null,
    concepto: (formData.get('concepto') as 'REPARACION'|'SERVICE'|'MANTENIMIENTO'|'REVISION'|'GARANTIA'|'OTRO') || 'REPARACION',
    combustible: (formData.get('combustible') as 'Bajo'|'Cuarto'|'Medio'|'Alto'|'Lleno') || null,
    kilometraje: formData.get('kilometraje') ? Number(formData.get('kilometraje')) : null,
    categoria: (formData.get('categoria') as string) || null,
    observaciones: (formData.get('observaciones') as string) || null,
    comentarioInterno: (formData.get('comentario_interno') as string) || null,
    createdBy: u.id,
  }).returning({ id: schema.ordenes.id });

  const comprobante = generateComprobante(row.id);
  await db.update(schema.ordenes).set({ comprobante })
    .where(and(eq(schema.ordenes.id, row.id), eq(schema.ordenes.tenantId, u.tenantId)));

  await audit(u.tenantId, u.id, 'orden.create', { type: 'orden', id: row.id }, { comprobante, clienteId, vehiculoId });

  const data = await db.query.ordenes.findFirst({
    where: and(eq(schema.ordenes.id, row.id), eq(schema.ordenes.tenantId, u.tenantId)),
    with: { cliente: true, vehiculo: true },
  });
  if (data) {
    const veh = data.vehiculo ? `${data.vehiculo.marca || ''} ${data.vehiculo.modelo || ''} ${data.vehiculo.dominio || ''}`.trim() : 's/v';
    await notificar('nueva_orden',
      `🔧 *Nueva orden ${comprobante}*\n\nCliente: ${data.cliente?.nombre || 's/c'}\nVehículo: ${veh}\nConcepto: ${data.concepto}`,
      u.tenantId,
    );
  }

  revalidatePath(`/${slug}/dashboard/ordenes`);
  redirect(`/${slug}/dashboard/ordenes/${row.id}`);
}

export async function updateOrden(id: number, formData: FormData) {
  const u = await ctx();
  const slug = await getSlug();
  const pagoEfectivo = Number(formData.get('pago_efectivo') || 0);
  const pagoOtroMonto = Number(formData.get('pago_otro_monto') || 0);

  const cur = await db.select({ totalBruto: schema.ordenes.totalBruto })
    .from(schema.ordenes)
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)))
    .limit(1);
  const totalBruto = Number(cur[0]?.totalBruto || 0);
  const pagoEstado = calcPagoEstado(totalBruto, pagoEfectivo + pagoOtroMonto);

  await db.update(schema.ordenes).set({
    tecnicoId: formData.get('tecnico_id') ? Number(formData.get('tecnico_id')) : null,
    concepto: (formData.get('concepto') as 'REPARACION'|'SERVICE'|'MANTENIMIENTO'|'REVISION'|'GARANTIA'|'OTRO') || 'REPARACION',
    combustible: (formData.get('combustible') as 'Bajo'|'Cuarto'|'Medio'|'Alto'|'Lleno') || null,
    kilometraje: formData.get('kilometraje') ? Number(formData.get('kilometraje')) : null,
    categoria: (formData.get('categoria') as string) || null,
    estado: (formData.get('estado') as 'ingresado'|'diagnostico'|'en_reparacion'|'reparado'|'entregado') || 'ingresado',
    fechaEgreso: formData.get('fecha_egreso') ? new Date(String(formData.get('fecha_egreso'))) : null,
    observaciones: (formData.get('observaciones') as string) || null,
    comentarioInterno: (formData.get('comentario_interno') as string) || null,
    pagoEfectivo: String(pagoEfectivo),
    pagoOtroMedio: (formData.get('pago_otro_medio') as string) || null,
    pagoOtroMonto: String(pagoOtroMonto),
    pagoEstado,
    updatedAt: new Date(),
  }).where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)));

  await sincronizarMovimientoCajaOrden(id, u.tenantId, u.id);
  await audit(u.tenantId, u.id, 'orden.update', { type: 'orden', id }, { estado: formData.get('estado'), concepto: formData.get('concepto'), pagoEstado });

  const nuevoEstado = formData.get('estado');
  if (nuevoEstado === 'entregado') {
    try {
      const autoEnabled = await getConfig('recordatorio_auto_enabled', u.tenantId);
      if (autoEnabled === 'true') {
        const o = await db.query.ordenes.findFirst({
          where: and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)),
          with: { cliente: true, vehiculo: true },
        });
        if (o && ['SERVICE', 'MANTENIMIENTO', 'REVISION'].includes(o.concepto || '')) {
          const diasStr = await getConfig('recordatorio_auto_service_dias', u.tenantId);
          const kmStr = await getConfig('recordatorio_auto_service_km', u.tenantId);
          const dias = Number(diasStr) || 180;
          const kmAdd = Number(kmStr) || 10000;
          const fechaProgramada = new Date();
          fechaProgramada.setDate(fechaProgramada.getDate() + dias);
          const kmProg = o.kilometraje ? o.kilometraje + kmAdd : null;

          if (o.vehiculoId) {
            const existing = await db.select({ id: schema.recordatorios.id })
              .from(schema.recordatorios)
              .where(and(
                eq(schema.recordatorios.tenantId, u.tenantId),
                eq(schema.recordatorios.vehiculoId, o.vehiculoId),
                eq(schema.recordatorios.tipo, 'service'),
                eq(schema.recordatorios.estado, 'pendiente'),
              )).limit(1);
            if (!existing[0]) {
              await db.insert(schema.recordatorios).values({
                tenantId: u.tenantId,
                tipo: 'service',
                titulo: `Service ${o.vehiculo?.marca || ''} ${o.vehiculo?.modelo || ''} (${o.vehiculo?.dominio || ''})`.trim(),
                detalle: `Próximo service programado tras orden ${o.comprobante}`,
                clienteId: o.clienteId,
                vehiculoId: o.vehiculoId,
                ordenId: o.id,
                fechaProgramada,
                kilometrajeProgramado: kmProg,
                estado: 'pendiente',
                createdBy: u.id,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('auto-recordatorio failed', e);
    }
  }

  const pagado = pagoEfectivo + pagoOtroMonto;
  if (pagoEstado === 'pagado' && pagado > 0) {
    const minStr = await getConfig('telegram_alerta_pago_min', u.tenantId).catch(() => '0');
    const min = Number(minStr) || 0;
    if (pagado >= min) {
      const data = await db.query.ordenes.findFirst({
        where: and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)),
        with: { cliente: true, vehiculo: true },
      });
      if (data) {
        const veh = data.vehiculo?.dominio || '';
        await notificar('pago_recibido',
          `💰 *Cobro: $${pagado.toLocaleString('es-AR')}*\n\nOrden: ${data.comprobante}\nCliente: ${data.cliente?.nombre || 's/c'}\nVehículo: ${veh}`,
          u.tenantId,
        );
      }
    }
  }

  revalidatePath(`/${slug}/dashboard/ordenes/${id}`);
  revalidatePath(`/${slug}/dashboard/ordenes`);
  revalidatePath(`/${slug}/dashboard/caja`);
  redirect(`/${slug}/dashboard/ordenes/${id}`);
}

export async function addItem(ordenId: number, formData: FormData) {
  const u = await ctx();
  const importe = Number(formData.get('importe') || 0);
  const cantidad = Number(formData.get('cantidad') || 1);
  const bonif = Number(formData.get('bonificacion_pct') || 0);
  const subtotal = importe * cantidad * (1 - bonif / 100);
  const tipo = (formData.get('tipo') as 'servicio'|'repuesto') || 'servicio';
  const inventarioItemId = Number(formData.get('inventario_item_id')) || null;

  await db.insert(schema.ordenItems).values({
    tenantId: u.tenantId,
    ordenId,
    inventarioItemId,
    nombre: String(formData.get('nombre') || '').trim(),
    tipo,
    importe: String(importe),
    cantidad: String(cantidad),
    bonificacionPct: String(bonif),
    ivaPct: String(formData.get('iva_pct') ?? 0),
    subtotal: String(subtotal),
  });

  if (inventarioItemId && tipo === 'repuesto') {
    await db.update(schema.inventarioItems)
      .set({ stock: sql`COALESCE(${schema.inventarioItems.stock}, 0) - ${cantidad}` })
      .where(and(eq(schema.inventarioItems.id, inventarioItemId), eq(schema.inventarioItems.tenantId, u.tenantId)));
  }

  await recalcularTotales(ordenId, u.tenantId);
  revalidatePath(`/dashboard/ordenes/${ordenId}`);
}

export async function removeItem(itemId: number, ordenId: number) {
  const u = await ctx();
  await db.delete(schema.ordenItems)
    .where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, u.tenantId)));
  await recalcularTotales(ordenId, u.tenantId);
  revalidatePath(`/dashboard/ordenes/${ordenId}`);
}

export async function updateItemInline(itemId: number, ordenId: number, patch: {
  nombre: string; tipo: 'servicio' | 'repuesto';
  importe: number; cantidad: number; bonificacionPct: number; ivaPct: number;
}) {
  const u = await ctx();
  const subtotal = patch.importe * patch.cantidad * (1 - patch.bonificacionPct / 100);
  await db.update(schema.ordenItems).set({
    nombre: patch.nombre.trim(),
    tipo: patch.tipo,
    importe: String(patch.importe),
    cantidad: String(patch.cantidad),
    bonificacionPct: String(patch.bonificacionPct),
    ivaPct: String(patch.ivaPct),
    subtotal: String(subtotal),
  }).where(and(eq(schema.ordenItems.id, itemId), eq(schema.ordenItems.tenantId, u.tenantId)));
  await recalcularTotales(ordenId, u.tenantId);
  revalidatePath(`/dashboard/ordenes/${ordenId}`);
}

export async function setOrdenClienteVehiculo(ordenId: number, clienteId: number | null, vehiculoId: number | null) {
  const u = await ctx();
  await db.update(schema.ordenes)
    .set({ clienteId, vehiculoId, updatedAt: new Date() })
    .where(and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, u.tenantId)));
  revalidatePath(`/dashboard/ordenes/${ordenId}`);
}

export async function updateClienteInline(clienteId: number, patch: {
  nombre?: string; dni?: string | null; telefono?: string | null; telefonoAlt?: string | null;
  email?: string | null; domicilio?: string | null; localidad?: string | null;
}, revalidateOrdenId?: number) {
  const u = await ctx();
  const cleaned: Partial<typeof schema.clientes.$inferInsert> = { updatedAt: new Date() };
  if (patch.nombre !== undefined) cleaned.nombre = patch.nombre.trim();
  if (patch.dni !== undefined) cleaned.dni = patch.dni;
  if (patch.telefono !== undefined) cleaned.telefono = patch.telefono;
  if (patch.telefonoAlt !== undefined) cleaned.telefonoAlt = patch.telefonoAlt;
  if (patch.email !== undefined) cleaned.email = patch.email;
  if (patch.domicilio !== undefined) cleaned.domicilio = patch.domicilio;
  if (patch.localidad !== undefined) cleaned.localidad = patch.localidad;
  await db.update(schema.clientes).set(cleaned)
    .where(and(eq(schema.clientes.id, clienteId), eq(schema.clientes.tenantId, u.tenantId)));
  if (revalidateOrdenId) revalidatePath(`/dashboard/ordenes/${revalidateOrdenId}`);
  revalidatePath(`/dashboard/clientes/${clienteId}`);
}

export async function updateVehiculoInline(vehiculoId: number, patch: {
  dominio?: string; marca?: string | null; modelo?: string | null; anio?: number | null;
  color?: string | null; tipo?: string | null; kilometraje?: number | null; chasis?: string | null;
}, revalidateOrdenId?: number) {
  const u = await ctx();
  const cleaned: Partial<typeof schema.vehiculos.$inferInsert> = {};
  if (patch.dominio !== undefined) cleaned.dominio = patch.dominio.toUpperCase().trim();
  if (patch.marca !== undefined) cleaned.marca = patch.marca;
  if (patch.modelo !== undefined) cleaned.modelo = patch.modelo;
  if (patch.anio !== undefined) cleaned.anio = patch.anio;
  if (patch.color !== undefined) cleaned.color = patch.color;
  if (patch.tipo !== undefined) cleaned.tipo = patch.tipo;
  if (patch.kilometraje !== undefined) cleaned.kilometraje = patch.kilometraje;
  if (patch.chasis !== undefined) cleaned.chasis = patch.chasis;
  await db.update(schema.vehiculos).set(cleaned)
    .where(and(eq(schema.vehiculos.id, vehiculoId), eq(schema.vehiculos.tenantId, u.tenantId)));
  if (revalidateOrdenId) revalidatePath(`/dashboard/ordenes/${revalidateOrdenId}`);
  revalidatePath(`/dashboard/vehiculos/${vehiculoId}`);
}

export async function deleteOrden(id: number) {
  const u = await ctx();
  const slug = await getSlug();
  if (u.role !== 'admin' && u.role !== 'owner' && u.role !== 'recepcion') throw new Error('unauthorized');
  const o = await db.select({ comprobante: schema.ordenes.comprobante })
    .from(schema.ordenes)
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)))
    .limit(1);
  if (!o[0]) throw new Error('orden not found');
  await db.delete(schema.ordenItems)
    .where(and(eq(schema.ordenItems.ordenId, id), eq(schema.ordenItems.tenantId, u.tenantId)));
  await db.delete(schema.ordenAttachments)
    .where(and(eq(schema.ordenAttachments.ordenId, id), eq(schema.ordenAttachments.tenantId, u.tenantId)));
  await db.delete(schema.ordenes)
    .where(and(eq(schema.ordenes.id, id), eq(schema.ordenes.tenantId, u.tenantId)));
  await audit(u.tenantId, u.id, 'orden.delete', { type: 'orden', id }, { comprobante: o[0]?.comprobante });
  revalidatePath(`/${slug}/dashboard/ordenes`);
  redirect(`/${slug}/dashboard/ordenes`);
}
