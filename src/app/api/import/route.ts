import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { parseDirupHtml, detectKind } from '@/lib/import/dirup-parser';
import { importClientes, importVehiculos, importInventario, importMovimientos, importOrdenes } from '@/lib/import/importers';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll('files') as File[];
  if (!files.length) return NextResponse.json({ error: 'no files' }, { status: 400 });

  const results: { file: string; kind: string; inserted: number; updated: number; skipped: number; itemsInserted?: number; error?: string }[] = [];

  // Sort files: clientes first, vehiculos next, ordenes last
  type Loaded = { file: File; rows: Awaited<ReturnType<typeof parseDirupHtml>>; kind: ReturnType<typeof detectKind> };
  const loaded: Loaded[] = [];
  for (const f of files) {
    try {
      const text = await f.text();
      const rows = parseDirupHtml(text);
      if (rows.length === 0) continue;
      const headers = Object.keys(rows[0]);
      const kind = detectKind(headers);
      loaded.push({ file: f, rows, kind });
    } catch (e) {
      results.push({ file: f.name, kind: 'unknown', inserted: 0, updated: 0, skipped: 0, error: String(e) });
    }
  }

  const order = ['clientes', 'vehiculos', 'inventario', 'movimientos', 'cierres', 'recordatorios', 'ordenes', 'unknown'];
  loaded.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));

  for (const { file, rows, kind } of loaded) {
    try {
      let stats: { inserted: number; updated: number; skipped: number; itemsInserted?: number } = { inserted: 0, updated: 0, skipped: 0 };
      if (kind === 'clientes') stats = await importClientes(rows, user.tenantId);
      else if (kind === 'vehiculos') stats = await importVehiculos(rows, user.tenantId);
      else if (kind === 'inventario') stats = await importInventario(rows, user.tenantId);
      else if (kind === 'movimientos') stats = await importMovimientos(rows, user.tenantId);
      else if (kind === 'ordenes') stats = await importOrdenes(rows, user.tenantId);
      else stats = { inserted: 0, updated: 0, skipped: rows.length };
      results.push({ file: file.name, kind, ...stats });
    } catch (e) {
      results.push({ file: file.name, kind, inserted: 0, updated: 0, skipped: 0, error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
