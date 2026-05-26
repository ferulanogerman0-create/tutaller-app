import PDFDocument from 'pdfkit';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getAllConfig } from '@/lib/actions/config';

const CYAN = '#00B4D8';
const BLACK = '#0A0A0A';
const GRAY = '#666666';

export async function generarPdfOrden(ordenId: number, tenantId?: number): Promise<Buffer> {
  const data = await db.query.ordenes.findFirst({
    where: tenantId
      ? and(eq(schema.ordenes.id, ordenId), eq(schema.ordenes.tenantId, tenantId))
      : eq(schema.ordenes.id, ordenId),
    with: { cliente: true, vehiculo: true, items: true, tecnico: true },
  });
  if (!data) throw new Error('Orden no encontrada');
  const cfg = await getAllConfig(tenantId);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // HEADER
    doc.fillColor(BLACK).rect(0, 0, doc.page.width, 80).fill();
    doc.fillColor(CYAN).fontSize(26).font('Helvetica-Bold').text(cfg.taller_nombre.split(' ')[0] || 'FMA', 40, 25);
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text(`${cfg.taller_subtitulo} · ${cfg.taller_direccion}`, 40, 55);
    doc.fillColor(CYAN).fontSize(18).font('Helvetica-Bold').text(data.comprobante, 0, 30, { align: 'right', width: doc.page.width - 40 });
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica').text(
      data.estado.toUpperCase().replace('_', ' '), 0, 55, { align: 'right', width: doc.page.width - 40 },
    );

    doc.fillColor(BLACK).y = 100;

    // CLIENTE + VEHICULO
    const yTop = 100;
    doc.fontSize(9).fillColor(CYAN).font('Helvetica-Bold').text('CLIENTE', 40, yTop);
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(11).text(data.cliente?.nombre || '—', 40, yTop + 12);
    doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(`DNI/CUIT: ${data.cliente?.dni || data.cliente?.cuit || '—'}`, 40, yTop + 28);
    doc.text(`Tel: ${data.cliente?.telefono || '—'}`, 40, yTop + 40);
    doc.text(`Email: ${data.cliente?.email || '—'}`, 40, yTop + 52);

    doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(9).text('VEHÍCULO', 320, yTop);
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(11).text(
      `${data.vehiculo?.marca || ''} ${data.vehiculo?.modelo || ''}`.trim() || '—', 320, yTop + 12,
    );
    doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(`Dominio: ${data.vehiculo?.dominio || '—'}`, 320, yTop + 28);
    doc.text(`Año: ${data.vehiculo?.anio || '—'}  ·  KM: ${data.kilometraje || '—'}`, 320, yTop + 40);
    doc.text(`Combustible: ${data.combustible || '—'}`, 320, yTop + 52);

    doc.moveTo(40, yTop + 75).lineTo(doc.page.width - 40, yTop + 75).strokeColor('#DDDDDD').stroke();

    // FECHAS + CONCEPTO
    let y = yTop + 90;
    doc.fillColor(GRAY).fontSize(9).font('Helvetica');
    doc.text(`Ingreso: ${new Date(data.fechaIngreso).toLocaleString('es-AR')}`, 40, y);
    if (data.fechaEgreso) {
      doc.text(`Egreso: ${new Date(data.fechaEgreso).toLocaleString('es-AR')}`, 250, y);
    }
    doc.text(`Concepto: ${data.concepto}`, 420, y);
    y += 20;

    // ITEMS
    doc.fillColor(CYAN).fontSize(10).font('Helvetica-Bold').text('DETALLE', 40, y);
    y += 18;
    // Header tabla
    doc.fillColor('#F0F0F0').rect(40, y, doc.page.width - 80, 18).fill();
    doc.fillColor(BLACK).fontSize(9).font('Helvetica-Bold');
    doc.text('Item', 45, y + 5, { width: 230 });
    doc.text('Tipo', 280, y + 5, { width: 50 });
    doc.text('Cant', 330, y + 5, { width: 35, align: 'right' });
    doc.text('Importe', 365, y + 5, { width: 60, align: 'right' });
    doc.text('Bonif%', 425, y + 5, { width: 35, align: 'right' });
    doc.text('Subtotal', 460, y + 5, { width: 95, align: 'right' });
    y += 22;

    doc.font('Helvetica').fontSize(9).fillColor(BLACK);
    for (const it of data.items) {
      if (y > doc.page.height - 200) {
        doc.addPage();
        y = 50;
      }
      doc.text(it.nombre, 45, y, { width: 230 });
      doc.text(it.tipo, 280, y, { width: 50 });
      doc.text(String(Number(it.cantidad)), 330, y, { width: 35, align: 'right' });
      doc.text(`$${Number(it.importe).toLocaleString('es-AR')}`, 365, y, { width: 60, align: 'right' });
      doc.text(`${Number(it.bonificacionPct)}%`, 425, y, { width: 35, align: 'right' });
      doc.text(`$${Number(it.subtotal).toLocaleString('es-AR')}`, 460, y, { width: 95, align: 'right' });
      y += 16;
    }

    // TOTALES
    y += 10;
    doc.moveTo(330, y).lineTo(doc.page.width - 40, y).strokeColor('#DDDDDD').stroke();
    y += 8;
    const rightCol = (label: string, val: string, bold = false) => {
      doc.fillColor(GRAY).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(label, 330, y, { width: 130, align: 'right' });
      doc.fillColor(BLACK).fontSize(bold ? 12 : 9).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(val, 460, y, { width: 95, align: 'right' });
      y += bold ? 18 : 14;
    };
    rightCol('Total repuestos:', `$${Number(data.totalRepuestos).toLocaleString('es-AR')}`);
    rightCol('Total mano de obra:', `$${Number(data.totalManoObra).toLocaleString('es-AR')}`);
    rightCol('Neto:', `$${Number(data.totalNeto).toLocaleString('es-AR')}`);
    rightCol('IVA:', `$${Number(data.totalIva).toLocaleString('es-AR')}`);
    doc.fillColor(CYAN);
    rightCol('TOTAL:', `$${Number(data.totalBruto).toLocaleString('es-AR')}`, true);
    doc.fillColor(BLACK);
    const pagado = Number(data.pagoEfectivo) + Number(data.pagoOtroMonto);
    rightCol('Pagado:', `$${pagado.toLocaleString('es-AR')}`);
    const saldo = Number(data.totalBruto) - pagado;
    if (saldo > 0) {
      doc.fillColor('#CC0000');
      rightCol('SALDO PENDIENTE:', `$${saldo.toLocaleString('es-AR')}`, true);
      doc.fillColor(BLACK);
    }

    // OBSERVACIONES
    if (data.observaciones) {
      y += 10;
      doc.fillColor(CYAN).fontSize(10).font('Helvetica-Bold').text('OBSERVACIONES', 40, y);
      y += 14;
      doc.fillColor(BLACK).fontSize(9).font('Helvetica').text(data.observaciones, 40, y, { width: doc.page.width - 80 });
    }

    // FOOTER
    const fy = doc.page.height - 60;
    doc.moveTo(40, fy).lineTo(doc.page.width - 40, fy).strokeColor('#DDDDDD').stroke();
    doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(
      `${cfg.taller_nombre} · ${cfg.taller_direccion} · WhatsApp ${cfg.taller_telefono}`,
      40, fy + 8, { width: doc.page.width - 80, align: 'center' },
    );
    doc.text(cfg.pdf_footer, 40, fy + 22, { width: doc.page.width - 80, align: 'center' });

    doc.end();
  });
}
