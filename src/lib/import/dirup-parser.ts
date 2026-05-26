import { parse } from 'node-html-parser';

export type Row = Record<string, string | null>;

export function parseDirupHtml(html: string): Row[] {
  const root = parse(html);
  const rows = root.querySelectorAll('tr');
  if (rows.length === 0) return [];

  // First row = headers (th)
  const headerCells = rows[0].querySelectorAll('th, td');
  const headers = headerCells.map((c) => c.innerText.trim());

  const out: Row[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('th, td');
    if (cells.length === 0) continue;
    const obj: Row = {};
    for (let j = 0; j < headers.length; j++) {
      const v = cells[j]?.innerText?.trim() || '';
      obj[headers[j]] = v || null;
    }
    out.push(obj);
  }
  return out;
}

export function detectKind(headers: string[]): 'clientes' | 'vehiculos' | 'ordenes' | 'inventario' | 'movimientos' | 'cierres' | 'recordatorios' | 'unknown' {
  const h = new Set(headers.map(x => x.toLowerCase()));
  if (h.has('dominio') && h.has('marca') && h.has('modelo')) return 'vehiculos';
  if (h.has('comprobante') && h.has('subtotal')) return 'ordenes';
  if (h.has('dni') && h.has('nombre') && h.has('telefono')) return 'clientes';
  if (h.has('precio_venta') || h.has('precio_venta_bruto')) return 'inventario';
  if (h.has('monto_cierre') && h.has('fecha_cierre')) return 'cierres';
  if (h.has('efectivo_importe_pago') && h.has('fecha')) return 'movimientos';
  if (h.has('fecha_aviso')) return 'recordatorios';
  return 'unknown';
}
