'use server';
import { db, schema } from '@/lib/db';
import { eq, count, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { notificar } from '@/lib/notificar';
import { PREMIO_LABEL } from '@/lib/referidos-constants';

export async function registrarReferidoPublico(formData: FormData) {
  const codigoStr = String(formData.get('codigo') || '').trim().toUpperCase();
  const slug = String(formData.get('slug') || '').trim();
  const nombre = String(formData.get('nombre') || '').trim();
  const telefono = String(formData.get('telefono') || '').trim();
  const servicio = String(formData.get('servicio') || '').trim();
  const vehiculoDominio = String(formData.get('vehiculo_dominio') || '').trim().toUpperCase() || null;

  if (!codigoStr || !nombre || !servicio || !telefono) {
    redirect(`/${slug}/r/${codigoStr}?err=${encodeURIComponent('Faltan datos obligatorios')}`);
  }

  // Resolve tenant from slug
  const [tenant] = await db.select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug))
    .limit(1);
  if (!tenant) redirect(`/${slug}/r/${codigoStr}?err=${encodeURIComponent('Taller no encontrado')}`);
  const tenantId = tenant.id;

  const [codigo] = await db.select().from(schema.referidosCodigos)
    .where(and(eq(schema.referidosCodigos.codigo, codigoStr), eq(schema.referidosCodigos.tenantId, tenantId)))
    .limit(1);
  if (!codigo) redirect(`/${slug}/r/${codigoStr}?err=${encodeURIComponent('Código no encontrado')}`);
  if (codigo.premiado) redirect(`/${slug}/r/${codigoStr}?err=${encodeURIComponent('Código ya premiado')}`);

  const [{ c: n }] = await db.select({ c: count() })
    .from(schema.referidos)
    .where(and(eq(schema.referidos.codigoId, codigo.id), eq(schema.referidos.tenantId, tenantId)));
  if (n >= 3) redirect(`/${slug}/r/${codigoStr}?err=${encodeURIComponent('Código ya completo')}`);

  await db.insert(schema.referidos).values({
    tenantId,
    codigoId: codigo.id, nombre, servicio, vehiculoDominio,
  });

  const newCount = n + 1;
  const [refCliente] = await db.select({ nombre: schema.clientes.nombre, telefono: schema.clientes.telefono })
    .from(schema.clientes)
    .where(and(eq(schema.clientes.id, codigo.clienteId), eq(schema.clientes.tenantId, tenantId)))
    .limit(1);

  await db.insert(schema.referidosActividad).values({
    tenantId,
    tipo: 'referido',
    texto: `Nuevo referido público de ${refCliente?.nombre}`,
    sub: `${nombre} · ${telefono} · ${servicio} (${newCount}/3)`,
    codigoId: codigo.id,
  });

  await notificar('referido',
    `🎫 *Nuevo referido público*\n\nCódigo: ${codigo.codigo} (${refCliente?.nombre})\nReferido: ${nombre} · ${telefono}\nServicio: ${servicio}\nProgreso: ${newCount}/3`,
    tenantId,
  );

  if (newCount >= 3) {
    await db.insert(schema.referidosActividad).values({
      tenantId,
      tipo: 'completo',
      texto: `🎉 ${refCliente?.nombre} completó 3 referidos`,
      sub: `Premio: ${PREMIO_LABEL[codigo.premioTipo]}`,
      codigoId: codigo.id,
    });
    await notificar('completado',
      `🎉 *PREMIO COMPLETADO*\n\n${refCliente?.nombre} llegó a 3 referidos.\nPremio: ${PREMIO_LABEL[codigo.premioTipo]}\nTel referidor: ${refCliente?.telefono || 's/t'}`,
      tenantId,
    );
  }

  revalidatePath('/dashboard/referidos');
  redirect(`/${slug}/r/${codigoStr}?ok=1`);
}
