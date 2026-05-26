'use server';
import { db, schema } from '@/lib/db';
import { eq, ilike, or, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx } from './_ctx';

export async function listClientes(query?: string) {
  const u = await ctx();
  const conds = [eq(schema.clientes.tenantId, u.tenantId)];
  if (query && query.length > 0) {
    conds.push(or(
      ilike(schema.clientes.nombre, `%${query}%`),
      ilike(schema.clientes.dni, `%${query}%`),
      ilike(schema.clientes.telefono, `%${query}%`)
    )!);
  }
  return await db.select().from(schema.clientes).where(and(...conds)).orderBy(desc(schema.clientes.createdAt)).limit(100);
}

export async function getCliente(id: number) {
  const u = await ctx();
  const rows = await db.select().from(schema.clientes).where(and(eq(schema.clientes.id, id), eq(schema.clientes.tenantId, u.tenantId))).limit(1);
  return rows[0] || null;
}

export async function getClienteVehiculos(clienteId: number) {
  const u = await ctx();
  return await db.select().from(schema.vehiculos).where(and(eq(schema.vehiculos.clienteId, clienteId), eq(schema.vehiculos.tenantId, u.tenantId)));
}

export async function createCliente(formData: FormData) {
  const u = await ctx();
  const nombre = String(formData.get('nombre') || '').trim();
  if (!nombre) throw new Error('Nombre requerido');

  const [row] = await db.insert(schema.clientes).values({
    tenantId: u.tenantId,
    nombre,
    dni: (formData.get('dni') as string) || null,
    cuit: (formData.get('cuit') as string) || null,
    telefono: (formData.get('telefono') as string) || null,
    telefonoAlt: (formData.get('telefono_alt') as string) || null,
    email: (formData.get('email') as string) || null,
    emailAlt: (formData.get('email_alt') as string) || null,
    domicilio: (formData.get('domicilio') as string) || null,
    localidad: (formData.get('localidad') as string) || null,
    tipoResponsable: (formData.get('tipo_responsable') as string) || 'Consumidor Final',
    nombreFantasia: (formData.get('nombre_fantasia') as string) || null,
    contacto: (formData.get('contacto') as string) || null,
    comentario: (formData.get('comentario') as string) || null,
  }).returning({ id: schema.clientes.id });

  revalidatePath('/dashboard/clientes');
  redirect(`/dashboard/clientes/${row.id}`);
}

export async function updateCliente(id: number, formData: FormData) {
  const u = await ctx();
  await db.update(schema.clientes).set({
    nombre: String(formData.get('nombre') || '').trim(),
    dni: (formData.get('dni') as string) || null,
    cuit: (formData.get('cuit') as string) || null,
    telefono: (formData.get('telefono') as string) || null,
    telefonoAlt: (formData.get('telefono_alt') as string) || null,
    email: (formData.get('email') as string) || null,
    emailAlt: (formData.get('email_alt') as string) || null,
    domicilio: (formData.get('domicilio') as string) || null,
    localidad: (formData.get('localidad') as string) || null,
    tipoResponsable: (formData.get('tipo_responsable') as string) || 'Consumidor Final',
    nombreFantasia: (formData.get('nombre_fantasia') as string) || null,
    contacto: (formData.get('contacto') as string) || null,
    comentario: (formData.get('comentario') as string) || null,
    updatedAt: new Date(),
  }).where(and(eq(schema.clientes.id, id), eq(schema.clientes.tenantId, u.tenantId)));
  revalidatePath(`/dashboard/clientes/${id}`);
  redirect(`/dashboard/clientes/${id}`);
}
