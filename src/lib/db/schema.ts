// TuTaller — Database schema (multi-tenant)
// Drizzle ORM + Postgres. Toda tabla tiene tenant_id NOT NULL FK a tenants(id).
// Constraints unique globales movidos a (tenant_id, columna).

import {
  pgTable, serial, text, integer, bigint, timestamp, boolean, jsonb,
  varchar, decimal, pgEnum, uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== ENUMS =====
export const roleEnum = pgEnum('role', ['owner', 'admin', 'mecanico', 'recepcion', 'contable']);
export const ordenEstadoEnum = pgEnum('orden_estado', [
  'ingresado', 'diagnostico', 'en_reparacion', 'reparado', 'entregado',
]);
export const pagoEstadoEnum = pgEnum('pago_estado', ['pendiente', 'parcial', 'pagado']);
export const conceptoEnum = pgEnum('concepto', [
  'REPARACION', 'SERVICE', 'MANTENIMIENTO', 'REVISION', 'GARANTIA', 'OTRO',
]);
export const combustibleEnum = pgEnum('combustible', ['Bajo', 'Cuarto', 'Medio', 'Alto', 'Lleno']);
export const itemTipoEnum = pgEnum('item_tipo', ['servicio', 'repuesto']);
export const movimientoTipoEnum = pgEnum('movimiento_tipo', ['ingreso', 'egreso']);
export const planEnum = pgEnum('tenant_plan', ['trial', 'web', 'bot', 'enterprise']);

// ===== TENANTS =====
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  nombre: varchar('nombre', { length: 128 }).notNull(),
  nombreFantasia: varchar('nombre_fantasia', { length: 128 }),
  cuit: varchar('cuit', { length: 16 }),
  domicilio: text('domicilio'),
  localidad: varchar('localidad', { length: 64 }),
  telefono: varchar('telefono', { length: 32 }),
  emailContacto: varchar('email_contacto', { length: 128 }),
  logoUrl: text('logo_url'),
  colorPrimary: varchar('color_primary', { length: 7 }).notNull().default('#2563eb'),
  plan: planEnum('plan').notNull().default('trial'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  subscriptionId: varchar('subscription_id', { length: 64 }),
  evoInstanceName: varchar('evo_instance_name', { length: 64 }),
  waAdminJid: varchar('wa_admin_jid', { length: 64 }),
  waTurnosJid: varchar('wa_turnos_jid', { length: 64 }),
  waTallerJid: varchar('wa_taller_jid', { length: 64 }),
  waAllowlistPhones: text('wa_allowlist_phones'),
  botToken: varchar('bot_token', { length: 128 }),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxSlug: uniqueIndex('idx_tenants_slug').on(t.slug),
  idxEvo: uniqueIndex('idx_tenants_evo').on(t.evoInstanceName),
  idxAdminJid: uniqueIndex('idx_tenants_wa_admin').on(t.waAdminJid),
}));

// ===== USERS =====
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 64 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  nombre: varchar('nombre', { length: 128 }).notNull(),
  email: varchar('email', { length: 128 }),
  role: roleEnum('role').notNull().default('mecanico'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (t) => ({
  uqUsernameTenant: uniqueIndex('uq_users_tenant_username').on(t.tenantId, t.username),
  idxTenant: index('idx_users_tenant').on(t.tenantId),
}));

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenant: index('idx_sessions_tenant').on(t.tenantId),
}));

// ===== CLIENTES =====
export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 256 }).notNull(),
  nombreFantasia: varchar('nombre_fantasia', { length: 256 }),
  tipoDocumento: varchar('tipo_documento', { length: 16 }).default('DNI'),
  dni: varchar('dni', { length: 32 }),
  cuit: varchar('cuit', { length: 16 }),
  domicilio: text('domicilio'),
  localidad: varchar('localidad', { length: 128 }),
  tipoResponsable: varchar('tipo_responsable', { length: 64 }).default('Consumidor Final'),
  telefono: varchar('telefono', { length: 32 }),
  telefonoAlt: varchar('telefono_alt', { length: 32 }),
  email: varchar('email', { length: 128 }),
  emailAlt: varchar('email_alt', { length: 128 }),
  contacto: varchar('contacto', { length: 128 }),
  comentario: text('comentario'),
  saldoCuentaCorriente: decimal('saldo_cuenta_corriente', { precision: 14, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  dirupId: integer('dirup_id'),
}, (t) => ({
  idxTenantNombre: index('idx_clientes_tenant_nombre').on(t.tenantId, t.nombre),
  idxTenantDni: index('idx_clientes_tenant_dni').on(t.tenantId, t.dni),
  idxTenantTel: index('idx_clientes_tenant_tel').on(t.tenantId, t.telefono),
}));

// ===== VEHÍCULOS =====
export const vehiculos = pgTable('vehiculos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  dominio: varchar('dominio', { length: 16 }).notNull(),
  marca: varchar('marca', { length: 64 }),
  modelo: varchar('modelo', { length: 128 }),
  tipo: varchar('tipo', { length: 32 }),
  color: varchar('color', { length: 32 }),
  anio: integer('anio'),
  kilometraje: integer('kilometraje'),
  combustible: varchar('combustible', { length: 16 }),
  motor: varchar('motor', { length: 64 }),
  chasis: varchar('chasis', { length: 64 }),
  comentario: text('comentario'),
  clienteId: integer('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dirupId: integer('dirup_id'),
}, (t) => ({
  uqDominioTenant: uniqueIndex('uq_vehiculos_tenant_dominio').on(t.tenantId, t.dominio),
  idxTenantCliente: index('idx_vehiculos_tenant_cliente').on(t.tenantId, t.clienteId),
}));

// ===== ÓRDENES =====
export const ordenes = pgTable('ordenes', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  comprobante: varchar('comprobante', { length: 32 }).notNull(),
  clienteId: integer('cliente_id').references(() => clientes.id),
  vehiculoId: integer('vehiculo_id').references(() => vehiculos.id),
  tecnicoId: integer('tecnico_id').references(() => users.id),
  concepto: conceptoEnum('concepto').default('REPARACION'),
  combustible: combustibleEnum('combustible'),
  kilometraje: integer('kilometraje'),
  categoria: varchar('categoria', { length: 4 }),
  estado: ordenEstadoEnum('estado').notNull().default('ingresado'),
  pagoEstado: pagoEstadoEnum('pago_estado').notNull().default('pendiente'),
  fechaIngreso: timestamp('fecha_ingreso', { withTimezone: true }).notNull().defaultNow(),
  fechaEgreso: timestamp('fecha_egreso', { withTimezone: true }),
  totalRepuestos: decimal('total_repuestos', { precision: 14, scale: 2 }).notNull().default('0'),
  totalManoObra: decimal('total_mano_obra', { precision: 14, scale: 2 }).notNull().default('0'),
  totalNeto: decimal('total_neto', { precision: 14, scale: 2 }).notNull().default('0'),
  totalIva: decimal('total_iva', { precision: 14, scale: 2 }).notNull().default('0'),
  totalBruto: decimal('total_bruto', { precision: 14, scale: 2 }).notNull().default('0'),
  pagoEfectivo: decimal('pago_efectivo', { precision: 14, scale: 2 }).notNull().default('0'),
  pagoCuentaCorriente: decimal('pago_cuenta_corriente', { precision: 14, scale: 2 }).notNull().default('0'),
  pagoOtroMedio: varchar('pago_otro_medio', { length: 32 }),
  pagoOtroMonto: decimal('pago_otro_monto', { precision: 14, scale: 2 }).notNull().default('0'),
  pagoComprobante: varchar('pago_comprobante', { length: 64 }),
  observaciones: text('observaciones'),
  comentarioInterno: text('comentario_interno'),
  esPresupuesto: boolean('es_presupuesto').notNull().default(false),
  presupuestoAprobadoAt: timestamp('presupuesto_aprobado_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  dirupId: integer('dirup_id'),
}, (t) => ({
  uqCompTenant: uniqueIndex('uq_ordenes_tenant_comprobante').on(t.tenantId, t.comprobante),
  idxTenantCliente: index('idx_ordenes_tenant_cliente').on(t.tenantId, t.clienteId),
  idxTenantVehiculo: index('idx_ordenes_tenant_vehiculo').on(t.tenantId, t.vehiculoId),
  idxTenantEstado: index('idx_ordenes_tenant_estado').on(t.tenantId, t.estado),
  idxTenantFecha: index('idx_ordenes_tenant_fecha').on(t.tenantId, t.fechaIngreso),
}));

// ===== INVENTARIO =====
export const inventarioItems = pgTable('inventario_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  codigo: varchar('codigo', { length: 32 }),
  nombre: text('nombre').notNull(),
  tipo: itemTipoEnum('tipo').notNull(),
  precio: decimal('precio', { precision: 14, scale: 2 }).notNull().default('0'),
  categoria: varchar('categoria', { length: 64 }),
  stock: integer('stock'),
  stockMinimo: integer('stock_minimo').default(0),
  unidadMedida: varchar('unidad_medida', { length: 16 }).default('UNIDAD'),
  ivaPct: decimal('iva_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantNombre: index('idx_inv_tenant_nombre').on(t.tenantId, t.nombre),
  idxTenantTipo: index('idx_inv_tenant_tipo').on(t.tenantId, t.tipo),
}));

// ===== ORDEN ITEMS =====
export const ordenItems = pgTable('orden_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ordenId: integer('orden_id').notNull().references(() => ordenes.id, { onDelete: 'cascade' }),
  inventarioItemId: integer('inventario_item_id').references(() => inventarioItems.id, { onDelete: 'set null' }),
  nombre: text('nombre').notNull(),
  tipo: itemTipoEnum('tipo').notNull(),
  importe: decimal('importe', { precision: 14, scale: 2 }).notNull(),
  cantidad: decimal('cantidad', { precision: 10, scale: 2 }).notNull().default('1'),
  bonificacionPct: decimal('bonificacion_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  ivaPct: decimal('iva_pct', { precision: 5, scale: 2 }).notNull().default('0'),
  subtotal: decimal('subtotal', { precision: 14, scale: 2 }).notNull(),
  orden: integer('orden').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantOrden: index('idx_orden_items_tenant_orden').on(t.tenantId, t.ordenId),
}));

// ===== ATTACHMENTS =====
export const ordenAttachments = pgTable('orden_attachments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ordenId: integer('orden_id').notNull().references(() => ordenes.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 256 }).notNull(),
  mimeType: varchar('mime_type', { length: 64 }),
  storageUrl: text('storage_url').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenant: index('idx_attachments_tenant').on(t.tenantId),
}));

// ===== CAJA =====
export const cajaMovimientos = pgTable('caja_movimientos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tipo: movimientoTipoEnum('tipo').notNull(),
  detalle: text('detalle').notNull(),
  efectivo: decimal('efectivo', { precision: 14, scale: 2 }).notNull().default('0'),
  otroMedio: varchar('otro_medio', { length: 32 }),
  otroMonto: decimal('otro_monto', { precision: 14, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 14, scale: 2 }).notNull(),
  categoria: varchar('categoria', { length: 64 }),
  origen: varchar('origen', { length: 32 }).default('manual'),
  vehiculo: varchar('vehiculo', { length: 128 }),
  proveedor: varchar('proveedor', { length: 128 }),
  clienteRef: varchar('cliente_ref', { length: 128 }),
  fechaMovimiento: timestamp('fecha_movimiento', { withTimezone: true }),
  notionId: varchar('notion_id', { length: 64 }),
  ordenId: integer('orden_id').references(() => ordenes.id),
  cierreId: integer('cierre_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
}, (t) => ({
  idxTenantFecha: index('idx_caja_tenant_fecha').on(t.tenantId, t.createdAt),
  idxTenantOrden: index('idx_caja_tenant_orden').on(t.tenantId, t.ordenId),
}));

export const cajaCierres = pgTable('caja_cierres', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fechaApertura: timestamp('fecha_apertura', { withTimezone: true }).notNull(),
  fechaCierre: timestamp('fecha_cierre', { withTimezone: true }),
  saldoInicial: decimal('saldo_inicial', { precision: 14, scale: 2 }).notNull().default('0'),
  totalIngresos: decimal('total_ingresos', { precision: 14, scale: 2 }).notNull().default('0'),
  totalEgresos: decimal('total_egresos', { precision: 14, scale: 2 }).notNull().default('0'),
  saldoFinal: decimal('saldo_final', { precision: 14, scale: 2 }).notNull().default('0'),
  cerradoPor: integer('cerrado_por').references(() => users.id),
  notas: text('notas'),
}, (t) => ({
  idxTenant: index('idx_cierres_tenant').on(t.tenantId),
}));

// ===== REFERIDOS =====
export const premioTipoEnum = pgEnum('premio_tipo', ['aceite', 'descuento', 'eleccion']);

export const referidosCodigos = pgTable('referidos_codigos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  codigo: varchar('codigo', { length: 16 }).notNull(),
  clienteId: integer('cliente_id').notNull().references(() => clientes.id, { onDelete: 'cascade' }),
  premioTipo: premioTipoEnum('premio_tipo').notNull().default('aceite'),
  servicioInicial: text('servicio_inicial'),
  premiado: boolean('premiado').notNull().default(false),
  premiadoAt: timestamp('premiado_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uqCodigoTenant: uniqueIndex('uq_ref_tenant_codigo').on(t.tenantId, t.codigo),
}));

export const referidos = pgTable('referidos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  codigoId: integer('codigo_id').notNull().references(() => referidosCodigos.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 256 }).notNull(),
  servicio: text('servicio'),
  vehiculoDominio: varchar('vehiculo_dominio', { length: 16 }),
  ordenId: integer('orden_id').references(() => ordenes.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantCodigo: index('idx_referidos_tenant_codigo').on(t.tenantId, t.codigoId),
}));

export const referidosActividad = pgTable('referidos_actividad', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 32 }).notNull(),
  texto: text('texto').notNull(),
  sub: text('sub'),
  codigoId: integer('codigo_id').references(() => referidosCodigos.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantFecha: index('idx_ref_act_tenant_fecha').on(t.tenantId, t.createdAt),
}));

// ===== RECORDATORIOS =====
export const recordatorioTipoEnum = pgEnum('recordatorio_tipo', [
  'service', 'cambio_aceite', 'revision', 'vtv', 'seguro', 'otro',
]);
export const recordatorioEstadoEnum = pgEnum('recordatorio_estado', [
  'pendiente', 'enviado', 'completado', 'cancelado',
]);

export const recordatorios = pgTable('recordatorios', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tipo: recordatorioTipoEnum('tipo').notNull().default('service'),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  detalle: text('detalle'),
  clienteId: integer('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
  vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'set null' }),
  ordenId: integer('orden_id').references(() => ordenes.id, { onDelete: 'set null' }),
  fechaProgramada: timestamp('fecha_programada', { withTimezone: true }).notNull(),
  kilometrajeProgramado: integer('kilometraje_programado'),
  estado: recordatorioEstadoEnum('estado').notNull().default('pendiente'),
  enviadoAt: timestamp('enviado_at', { withTimezone: true }),
  completadoAt: timestamp('completado_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
}, (t) => ({
  idxTenantFecha: index('idx_rec_tenant_fecha').on(t.tenantId, t.fechaProgramada),
  idxTenantEstado: index('idx_rec_tenant_estado').on(t.tenantId, t.estado),
}));

// ===== TURNOS =====
export const turnoEstadoEnum = pgEnum('turno_estado', ['agendado', 'confirmado', 'en_proceso', 'completado', 'cancelado']);

export const turnos = pgTable('turnos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  titulo: varchar('titulo', { length: 256 }).notNull(),
  detalle: text('detalle'),
  clienteId: integer('cliente_id').references(() => clientes.id, { onDelete: 'set null' }),
  vehiculoId: integer('vehiculo_id').references(() => vehiculos.id, { onDelete: 'set null' }),
  tecnicoId: integer('tecnico_id').references(() => users.id, { onDelete: 'set null' }),
  ordenId: integer('orden_id').references(() => ordenes.id, { onDelete: 'set null' }),
  fechaInicio: timestamp('fecha_inicio', { withTimezone: true }).notNull(),
  fechaFin: timestamp('fecha_fin', { withTimezone: true }),
  estado: turnoEstadoEnum('estado').notNull().default('agendado'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
}, (t) => ({
  idxTenantFecha: index('idx_turnos_tenant_fecha').on(t.tenantId, t.fechaInicio),
}));

// ===== CONFIG =====
export const config = pgTable('config', {
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 64 }).notNull(),
  value: text('value'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer('updated_by').references(() => users.id),
}, (t) => ({
  pk: uniqueIndex('pk_config_tenant_key').on(t.tenantId, t.key),
}));

// ===== PROVEEDORES =====
export const proveedores = pgTable('proveedores', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 256 }).notNull(),
  cuit: varchar('cuit', { length: 16 }),
  telefono: varchar('telefono', { length: 32 }),
  email: varchar('email', { length: 128 }),
  direccion: text('direccion'),
  rubro: varchar('rubro', { length: 64 }),
  comentario: text('comentario'),
  saldo: decimal('saldo', { precision: 14, scale: 2 }).notNull().default('0'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantNombre: index('idx_prov_tenant_nombre').on(t.tenantId, t.nombre),
}));

// ===== AUDIT =====
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 64 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }),
  entityId: integer('entity_id'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  idxTenantUser: index('idx_audit_tenant_user').on(t.tenantId, t.userId, t.createdAt),
  idxTenantEntity: index('idx_audit_tenant_entity').on(t.tenantId, t.entityType, t.entityId),
}));

// ===== RELATIONS =====
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  clientes: many(clientes),
  vehiculos: many(vehiculos),
  ordenes: many(ordenes),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [clientes.tenantId], references: [tenants.id] }),
  vehiculos: many(vehiculos),
  ordenes: many(ordenes),
}));

export const vehiculosRelations = relations(vehiculos, ({ one, many }) => ({
  tenant: one(tenants, { fields: [vehiculos.tenantId], references: [tenants.id] }),
  cliente: one(clientes, { fields: [vehiculos.clienteId], references: [clientes.id] }),
  ordenes: many(ordenes),
}));

export const ordenesRelations = relations(ordenes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [ordenes.tenantId], references: [tenants.id] }),
  cliente: one(clientes, { fields: [ordenes.clienteId], references: [clientes.id] }),
  vehiculo: one(vehiculos, { fields: [ordenes.vehiculoId], references: [vehiculos.id] }),
  tecnico: one(users, { fields: [ordenes.tecnicoId], references: [users.id] }),
  items: many(ordenItems),
  attachments: many(ordenAttachments),
}));

export const ordenItemsRelations = relations(ordenItems, ({ one }) => ({
  tenant: one(tenants, { fields: [ordenItems.tenantId], references: [tenants.id] }),
  orden: one(ordenes, { fields: [ordenItems.ordenId], references: [ordenes.id] }),
}));

export const recordatoriosRelations = relations(recordatorios, ({ one }) => ({
  tenant: one(tenants, { fields: [recordatorios.tenantId], references: [tenants.id] }),
  cliente: one(clientes, { fields: [recordatorios.clienteId], references: [clientes.id] }),
  vehiculo: one(vehiculos, { fields: [recordatorios.vehiculoId], references: [vehiculos.id] }),
  orden: one(ordenes, { fields: [recordatorios.ordenId], references: [ordenes.id] }),
}));

export const turnosRelations = relations(turnos, ({ one }) => ({
  tenant: one(tenants, { fields: [turnos.tenantId], references: [tenants.id] }),
  cliente: one(clientes, { fields: [turnos.clienteId], references: [clientes.id] }),
  vehiculo: one(vehiculos, { fields: [turnos.vehiculoId], references: [vehiculos.id] }),
  tecnico: one(users, { fields: [turnos.tecnicoId], references: [users.id] }),
  orden: one(ordenes, { fields: [turnos.ordenId], references: [ordenes.id] }),
}));
