'use server';
import { db, schema } from '@/lib/db';
import { eq, desc, sql, count, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx } from './_ctx';
import { PREMIO_LABEL } from '@/lib/referidos-constants';

async function nextCodigo(tenantId: number) {
  const [r] = await db.select({ c: count() }).from(schema.referidosCodigos)
    .where(eq(schema.referidosCodigos.tenantId, tenantId));
  const n = (r.c || 0) + 1;
  return `REF-${String(n).padStart(4, '0')}`;
}

export async function listCodigos(filter?: 'sin' | 'progreso' | 'completo' | 'premiado' | 'todos') {
  const u = await ctx();
  const rows = await db.select({
    codigo: schema.referidosCodigos,
    cliente: schema.clientes,
    refCount: sql<number>`coalesce((select count(*) from ${schema.referidos} where ${schema.referidos.codigoId} = ${schema.referidosCodigos.id}), 0)`.as('ref_count'),
  })
    .from(schema.referidosCodigos)
    .innerJoin(schema.clientes, eq(schema.referidosCodigos.clienteId, schema.clientes.id))
    .where(eq(schema.referidosCodigos.tenantId, u.tenantId))
    .orderBy(desc(schema.referidosCodigos.createdAt));

  if (!filter || filter === 'todos') return rows;
  return rows.filter(r => {
    const n = Number(r.refCount);
    if (filter === 'sin') return n === 0;
    if (filter === 'progreso') return n > 0 && n < 3;
    if (filter === 'completo') return n >= 3 && !r.codigo.premiado;
    if (filter === 'premiado') return r.codigo.premiado;
    return true;
  });
}

export async function getCodigoByValue(codigo: string, tenantId: number) {
  const rows = await db.select().from(schema.referidosCodigos)
    .where(and(eq(schema.referidosCodigos.codigo, codigo.toUpperCase()), eq(schema.referidosCodigos.tenantId, tenantId)))
    .limit(1);
  return rows[0] || null;
}

export async function getCodigoDetail(id: number) {
  const u = await ctx();
  const [row] = await db.select({
    codigo: schema.referidosCodigos,
    cliente: schema.clientes,
  })
    .from(schema.referidosCodigos)
    .innerJoin(schema.clientes, eq(schema.referidosCodigos.clienteId, schema.clientes.id))
    .where(and(eq(schema.referidosCodigos.id, id), eq(schema.referidosCodigos.tenantId, u.tenantId)))
    .limit(1);
  if (!row) return null;
  const refs = await db.select().from(schema.referidos)
    .where(and(eq(schema.referidos.codigoId, id), eq(schema.referidos.tenantId, u.tenantId)))
    .orderBy(desc(schema.referidos.createdAt));
  return { ...row, referidos: refs };
}

export async function createCodigo(formData: FormData) {
  const u = await ctx();
  const clienteId = Number(formData.get('cliente_id'));
  if (!clienteId) throw new Error('cliente_id requerido');
  const premioTipo = (formData.get('premio_tipo') as 'aceite'|'descuento'|'eleccion') || 'aceite';
  const servicioInicial = (formData.get('servicio_inicial') as string) || null;

  const existing = await db.select().from(schema.referidosCodigos)
    .where(and(eq(schema.referidosCodigos.clienteId, clienteId), eq(schema.referidosCodigos.tenantId, u.tenantId)))
    .limit(1);
  if (existing[0]) {
    redirect(`/dashboard/referidos/${existing[0].id}`);
  }

  const codigo = await nextCodigo(u.tenantId);
  const [row] = await db.insert(schema.referidosCodigos).values({
    tenantId: u.tenantId,
    codigo, clienteId, premioTipo, servicioInicial,
  }).returning({ id: schema.referidosCodigos.id });

  const cliente = await db.select().from(schema.clientes)
    .where(and(eq(schema.clientes.id, clienteId), eq(schema.clientes.tenantId, u.tenantId)))
    .limit(1);
  await db.insert(schema.referidosActividad).values({
    tenantId: u.tenantId,
    tipo: 'nuevo',
    texto: `Nuevo código de referidos: ${cliente[0]?.nombre}`,
    sub: `${codigo} — ${servicioInicial || 'sin servicio'}`,
    codigoId: row.id,
  });

  revalidatePath('/dashboard/referidos');
  redirect(`/dashboard/referidos/${row.id}`);
}

export async function registrarReferido(formData: FormData) {
  const u = await ctx();
  const codigoStr = String(formData.get('codigo') || '').trim().toUpperCase();
  const nombre = String(formData.get('nombre') || '').trim();
  const servicio = String(formData.get('servicio') || '').trim();
  const vehiculoDominio = (formData.get('vehiculo_dominio') as string)?.trim().toUpperCase() || null;

  const err = (msg: string) => {
    revalidatePath('/dashboard/referidos');
    redirect(`/dashboard/referidos?err=${encodeURIComponent(msg)}`);
  };

  if (!codigoStr || !nombre || !servicio) err('codigo, nombre y servicio son obligatorios');

  const codigo = await getCodigoByValue(codigoStr, u.tenantId);
  if (!codigo) err(`Código ${codigoStr} no encontrado`);
  if (codigo!.premiado) err('Código ya premiado');

  const [{ c: n }] = await db.select({ c: count() })
    .from(schema.referidos)
    .where(and(eq(schema.referidos.codigoId, codigo!.id), eq(schema.referidos.tenantId, u.tenantId)));
  if (n >= 3) err('Código completo (3/3) — pendiente entregar premio');

  await db.insert(schema.referidos).values({
    tenantId: u.tenantId,
    codigoId: codigo!.id, nombre, servicio, vehiculoDominio,
  });

  const newCount = n + 1;
  const cliente = await db.select({ nombre: schema.clientes.nombre }).from(schema.clientes)
    .where(and(eq(schema.clientes.id, codigo!.clienteId), eq(schema.clientes.tenantId, u.tenantId)))
    .limit(1);

  await db.insert(schema.referidosActividad).values({
    tenantId: u.tenantId,
    tipo: 'referido',
    texto: `Nuevo referido para ${cliente[0]?.nombre}`,
    sub: `${nombre} — ${servicio} (${newCount}/3)`,
    codigoId: codigo!.id,
  });

  if (newCount >= 3) {
    await db.insert(schema.referidosActividad).values({
      tenantId: u.tenantId,
      tipo: 'completo',
      texto: `🎉 ${cliente[0]?.nombre} completó 3 referidos`,
      sub: `Premio: ${PREMIO_LABEL[codigo!.premioTipo]}`,
      codigoId: codigo!.id,
    });
  }

  revalidatePath('/dashboard/referidos');
  redirect(`/dashboard/referidos?ok=${encodeURIComponent(`Referido registrado (${newCount}/3)`)}`);
}

export async function marcarPremiado(codigoId: number) {
  const u = await ctx();
  const [row] = await db.update(schema.referidosCodigos)
    .set({ premiado: true, premiadoAt: new Date() })
    .where(and(eq(schema.referidosCodigos.id, codigoId), eq(schema.referidosCodigos.tenantId, u.tenantId)))
    .returning({ premioTipo: schema.referidosCodigos.premioTipo, clienteId: schema.referidosCodigos.clienteId });

  const cliente = await db.select({ nombre: schema.clientes.nombre }).from(schema.clientes)
    .where(and(eq(schema.clientes.id, row.clienteId), eq(schema.clientes.tenantId, u.tenantId)))
    .limit(1);

  await db.insert(schema.referidosActividad).values({
    tenantId: u.tenantId,
    tipo: 'premiado',
    texto: `✅ Premio entregado a ${cliente[0]?.nombre}`,
    sub: PREMIO_LABEL[row.premioTipo],
    codigoId,
  });
  revalidatePath('/dashboard/referidos');
  revalidatePath(`/dashboard/referidos/${codigoId}`);
}

export async function deleteCodigo(codigoId: number) {
  const u = await ctx();
  await db.delete(schema.referidosCodigos)
    .where(and(eq(schema.referidosCodigos.id, codigoId), eq(schema.referidosCodigos.tenantId, u.tenantId)));
  revalidatePath('/dashboard/referidos');
  redirect('/dashboard/referidos');
}

export async function listActividad(limit = 50) {
  const u = await ctx();
  return await db.select().from(schema.referidosActividad)
    .where(eq(schema.referidosActividad.tenantId, u.tenantId))
    .orderBy(desc(schema.referidosActividad.createdAt))
    .limit(limit);
}

export async function statsReferidos() {
  const u = await ctx();
  const [total] = await db.select({ c: count() }).from(schema.referidosCodigos)
    .where(eq(schema.referidosCodigos.tenantId, u.tenantId));
  const codigos = await db.select({ id: schema.referidosCodigos.id, premiado: schema.referidosCodigos.premiado })
    .from(schema.referidosCodigos)
    .where(eq(schema.referidosCodigos.tenantId, u.tenantId));
  let activos = 0, completados = 0;
  for (const c of codigos) {
    const [r] = await db.select({ c: count() }).from(schema.referidos)
      .where(and(eq(schema.referidos.codigoId, c.id), eq(schema.referidos.tenantId, u.tenantId)));
    if (r.c > 0) activos++;
    if (r.c >= 3) completados++;
  }
  return { total: total.c, activos, completados };
}
