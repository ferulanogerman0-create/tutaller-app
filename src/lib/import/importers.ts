import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, sql, and } from 'drizzle-orm';
import type { Row } from './dirup-parser';

function toDate(s: string | null) {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
}
function toNum(s: string | null) {
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
export type OrdenEstado = 'ingresado' | 'diagnostico' | 'en_reparacion' | 'reparado' | 'entregado';

const DIRUP_ESTADO_MAP: Record<string, OrdenEstado> = {
  '0': 'entregado',
  '1': 'ingresado',
  '2': 'diagnostico',
  '3': 'en_reparacion',
  '4': 'reparado',
};

export function mapDirupEstado(raw: string | null): OrdenEstado | null {
  if (!raw) return null;
  const t = String(raw).trim();
  if (DIRUP_ESTADO_MAP[t]) return DIRUP_ESTADO_MAP[t];
  const lc = t.toLowerCase();
  if (lc.includes('entreg')) return 'entregado';
  if (lc.includes('en repar') || lc.includes('en_repar')) return 'en_reparacion';
  if (lc.includes('repar')) return 'reparado';
  if (lc.includes('diag')) return 'diagnostico';
  if (lc.includes('ingres')) return 'ingresado';
  return null;
}

export function mapDirupPago(raw: string | null): 'pagado' | 'parcial' | 'pendiente' | null {
  if (!raw) return null;
  const t = String(raw).trim().toLowerCase();
  if (t === 'realizado' || t === 'pagado') return 'pagado';
  if (t === 'parcial') return 'parcial';
  if (t === 'pendiente') return 'pendiente';
  return null;
}

function toStr(s: string | null) {
  if (!s) return null;
  const t = s.trim();
  return t.length ? t : null;
}

export async function importClientes(rows: Row[], tenantId: number) {
  let inserted = 0, updated = 0, skipped = 0;
  for (const r of rows) {
    const dirupId = Number(r['id']);
    const nombre = toStr(r['nombre']);
    if (!dirupId || !nombre) { skipped++; continue; }

    const values = {
      tenantId,
      nombre,
      dni: toStr(r['dni']),
      telefono: toStr(r['telefono']),
      telefonoAlt: toStr(r['telefono_alternativo']),
      email: toStr(r['email']),
      emailAlt: toStr(r['email_alternativo']),
      domicilio: toStr(r['domicilio_fiscal']),
      localidad: toStr(r['localidad_fiscal']),
      tipoResponsable: toStr(r['tipo_responsable']) || 'Consumidor Final',
      nombreFantasia: toStr(r['nombre_fantasia']),
      contacto: toStr(r['contacto']),
      comentario: toStr(r['comentario']),
      saldoCuentaCorriente: String(toNum(r['saldo_inicial']) ?? 0),
      dirupId,
    };

    const existing = await db.select({ id: schema.clientes.id })
      .from(schema.clientes)
      .where(and(eq(schema.clientes.dirupId, dirupId), eq(schema.clientes.tenantId, tenantId)))
      .limit(1);
    if (existing[0]) {
      await db.update(schema.clientes).set({ ...values, updatedAt: new Date() })
        .where(eq(schema.clientes.id, existing[0].id));
      updated++;
    } else {
      await db.insert(schema.clientes).values(values);
      inserted++;
    }
  }
  return { inserted, updated, skipped };
}

export async function importVehiculos(rows: Row[], tenantId: number) {
  let inserted = 0, updated = 0, skipped = 0;
  for (const r of rows) {
    const dirupId = Number(r['id']);
    const dominio = toStr(r['dominio'])?.toUpperCase();
    if (!dirupId || !dominio) { skipped++; continue; }

    let clienteId: number | null = null;
    const dirupClienteId = Number(r['id_cliente']);
    if (dirupClienteId) {
      const c = await db.select({ id: schema.clientes.id })
        .from(schema.clientes)
        .where(and(eq(schema.clientes.dirupId, dirupClienteId), eq(schema.clientes.tenantId, tenantId)))
        .limit(1);
      clienteId = c[0]?.id || null;
    }

    const values = {
      tenantId,
      dominio,
      marca: toStr(r['marca']),
      modelo: toStr(r['modelo']),
      tipo: toStr(r['tipo']),
      color: toStr(r['color']),
      anio: toNum(r['anio']),
      chasis: toStr(r['numero_chasis']),
      clienteId,
      dirupId,
    };

    const existing = await db.select({ id: schema.vehiculos.id })
      .from(schema.vehiculos)
      .where(and(eq(schema.vehiculos.dirupId, dirupId), eq(schema.vehiculos.tenantId, tenantId)))
      .limit(1);
    if (existing[0]) {
      await db.update(schema.vehiculos).set(values).where(eq(schema.vehiculos.id, existing[0].id));
      updated++;
    } else {
      try {
        await db.insert(schema.vehiculos).values(values);
        inserted++;
      } catch {
        skipped++;
      }
    }
  }
  return { inserted, updated, skipped };
}

export async function importInventario(rows: Row[], tenantId: number) {
  let inserted = 0, skipped = 0;
  for (const r of rows) {
    const nombre = toStr(r['nombre']);
    if (!nombre) { skipped++; continue; }
    const precio = toNum(r['precio_venta_bruto']) ?? toNum(r['precio_venta']) ?? 0;
    try {
      await db.insert(schema.inventarioItems).values({
        tenantId,
        nombre,
        tipo: toNum(r['costo_mano_obra']) ? 'servicio' : 'repuesto',
        precio: String(precio),
        ivaPct: String(toNum(r['alicuota_iva']) ?? 0),
        activo: true,
      });
      inserted++;
    } catch { skipped++; }
  }
  return { inserted, skipped, updated: 0 };
}

export async function importMovimientos(rows: Row[], tenantId: number) {
  let inserted = 0, skipped = 0;
  for (const r of rows) {
    const fecha = toDate(r['fecha']);
    const efectivo = toNum(r['efectivo_importe_pago']) ?? 0;
    const otroMonto = toNum(r['otro_importe_pago']) ?? 0;
    const total = toNum(r['total']) ?? (efectivo + otroMonto);
    const detalle = toStr(r['comentario']) || toStr(r['tipo']) || 'Movimiento importado DIRUP';
    try {
      await db.insert(schema.cajaMovimientos).values({
        tenantId,
        tipo: total >= 0 ? 'ingreso' : 'egreso',
        detalle,
        efectivo: String(efectivo),
        otroMedio: toStr(r['otro_medio_pago']),
        otroMonto: String(otroMonto),
        total: String(total),
        createdAt: fecha || new Date(),
      });
      inserted++;
    } catch { skipped++; }
  }
  return { inserted, skipped, updated: 0 };
}

export async function importOrdenes(rows: Row[], tenantId: number) {
  let inserted = 0, updated = 0, skipped = 0, itemsInserted = 0;

  for (const r of rows) {
    const itemNombre = toStr(r['item']);
    if (itemNombre) {
      const ordenDirupId = Number(r['id']) || Number(r['id_parent']);
      if (!ordenDirupId) { skipped++; continue; }
      const orden = await db.select({ id: schema.ordenes.id })
        .from(schema.ordenes)
        .where(and(eq(schema.ordenes.dirupId, ordenDirupId), eq(schema.ordenes.tenantId, tenantId)))
        .limit(1);
      if (!orden[0]) { skipped++; continue; }
      const importe = toNum(r['importe']) ?? 0;
      const cantidad = toNum(r['cantidad']) ?? 1;
      const descuento = toNum(r['descuento']) ?? 0;
      const ivaPct = toNum(r['alicuota_iva']) ?? 0;
      const tipoItem = String(r['tipo_item'] || '').toUpperCase();
      const tipo: 'servicio' | 'repuesto' = tipoItem === 'R' ? 'repuesto' : 'servicio';
      const subtotal = importe * cantidad * (1 - descuento / 100);
      const existingItem = await db.select({ id: schema.ordenItems.id })
        .from(schema.ordenItems)
        .where(and(
          eq(schema.ordenItems.ordenId, orden[0].id),
          eq(schema.ordenItems.nombre, itemNombre),
          eq(schema.ordenItems.importe, String(importe)),
        )).limit(1);
      if (existingItem[0]) { skipped++; continue; }
      try {
        await db.insert(schema.ordenItems).values({
          tenantId,
          ordenId: orden[0].id, nombre: itemNombre, tipo,
          importe: String(importe), cantidad: String(cantidad),
          bonificacionPct: String(descuento), ivaPct: String(ivaPct),
          subtotal: String(subtotal),
        });
        itemsInserted++;
      } catch { skipped++; }
      continue;
    }

    const dirupId = Number(r['id']);
    const comprobante = toStr(r['comprobante']);
    const nombreCliente = toStr(r['nombre_cliente']);
    const dominio = toStr(r['dominio_vehiculo'])?.toUpperCase();
    if (!dirupId || !comprobante) { skipped++; continue; }

    let clienteId: number | null = null;
    let vehiculoId: number | null = null;
    if (nombreCliente) {
      const c = await db.select({ id: schema.clientes.id })
        .from(schema.clientes)
        .where(and(
          sql`lower(${schema.clientes.nombre}) = lower(${nombreCliente})`,
          eq(schema.clientes.tenantId, tenantId),
        )).limit(1);
      clienteId = c[0]?.id || null;
    }
    if (dominio) {
      const v = await db.select({ id: schema.vehiculos.id })
        .from(schema.vehiculos)
        .where(and(eq(schema.vehiculos.dominio, dominio), eq(schema.vehiculos.tenantId, tenantId)))
        .limit(1);
      vehiculoId = v[0]?.id || null;
    }

    const fechaIngreso = toDate(r['fecha_emision']) || toDate(r['fecha']) || new Date();
    const totalBruto = toNum(r['total_bruto']) ?? toNum(r['total']) ?? 0;
    const totalNeto = toNum(r['total_neto']) ?? 0;
    const totalIva = toNum(r['total_iva']) ?? 0;
    const totalRepuestos = toNum(r['total_repuestos']) ?? 0;
    const totalManoObra = toNum(r['total_mano_obra']) ?? 0;
    const pagoEfectivo = toNum(r['efectivo_importe_pago']) ?? 0;
    const pagoOtro = toNum(r['otro_importe_pago']) ?? 0;
    const totalPagado = pagoEfectivo + pagoOtro;
    const pagoMapped = mapDirupPago(toStr(r['estado_pago']));
    const pagoEstado: 'pagado' | 'parcial' | 'pendiente' = pagoMapped
      ?? (totalBruto <= 0 ? 'pendiente'
        : totalPagado >= totalBruto ? 'pagado'
        : totalPagado > 0 ? 'parcial'
        : 'pendiente');
    const estado = mapDirupEstado(toStr(r['estado'])) ?? 'entregado';

    const existing = await db.select({ id: schema.ordenes.id })
      .from(schema.ordenes)
      .where(and(eq(schema.ordenes.dirupId, dirupId), eq(schema.ordenes.tenantId, tenantId)))
      .limit(1);
    const fechaEgreso = estado === 'entregado' ? fechaIngreso : null;

    if (existing[0]) {
      await db.update(schema.ordenes)
        .set({
          estado, pagoEstado,
          totalRepuestos: String(totalRepuestos),
          totalManoObra: String(totalManoObra),
          totalNeto: String(totalNeto),
          totalIva: String(totalIva),
          totalBruto: String(totalBruto),
          pagoEfectivo: String(pagoEfectivo),
          pagoOtroMedio: toStr(r['otro_medio_pago']),
          pagoOtroMonto: String(pagoOtro),
          fechaIngreso,
          fechaEgreso,
          updatedAt: fechaIngreso,
        })
        .where(eq(schema.ordenes.id, existing[0].id));
      updated++;
      continue;
    }

    try {
      await db.insert(schema.ordenes).values({
        tenantId,
        comprobante,
        clienteId, vehiculoId,
        concepto: 'REPARACION',
        estado,
        pagoEstado,
        fechaIngreso,
        fechaEgreso,
        totalRepuestos: String(totalRepuestos),
        totalManoObra: String(totalManoObra),
        totalNeto: String(totalNeto),
        totalIva: String(totalIva),
        totalBruto: String(totalBruto),
        pagoEfectivo: String(pagoEfectivo),
        pagoOtroMedio: toStr(r['otro_medio_pago']),
        pagoOtroMonto: String(pagoOtro),
        observaciones: toStr(r['descripcion']),
        comentarioInterno: toStr(r['descripcion_tecnica']) || toStr(r['comentario']),
        dirupId,
      });
      inserted++;
    } catch { skipped++; }
  }
  return { inserted, skipped, updated, itemsInserted };
}
