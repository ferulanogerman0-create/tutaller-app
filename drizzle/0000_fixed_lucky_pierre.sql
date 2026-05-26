CREATE TYPE "public"."combustible" AS ENUM('Bajo', 'Cuarto', 'Medio', 'Alto', 'Lleno');--> statement-breakpoint
CREATE TYPE "public"."concepto" AS ENUM('REPARACION', 'SERVICE', 'MANTENIMIENTO', 'REVISION', 'GARANTIA', 'OTRO');--> statement-breakpoint
CREATE TYPE "public"."item_tipo" AS ENUM('servicio', 'repuesto');--> statement-breakpoint
CREATE TYPE "public"."movimiento_tipo" AS ENUM('ingreso', 'egreso');--> statement-breakpoint
CREATE TYPE "public"."orden_estado" AS ENUM('ingresado', 'diagnostico', 'en_reparacion', 'reparado', 'entregado');--> statement-breakpoint
CREATE TYPE "public"."pago_estado" AS ENUM('pendiente', 'parcial', 'pagado');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'mecanico', 'recepcion', 'contable');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(32),
	"entity_id" integer,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_cierres" (
	"id" serial PRIMARY KEY NOT NULL,
	"fecha_apertura" timestamp with time zone NOT NULL,
	"fecha_cierre" timestamp with time zone,
	"saldo_inicial" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_ingresos" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_egresos" numeric(14, 2) DEFAULT '0' NOT NULL,
	"saldo_final" numeric(14, 2) DEFAULT '0' NOT NULL,
	"cerrado_por" integer,
	"notas" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caja_movimientos" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "movimiento_tipo" NOT NULL,
	"detalle" text NOT NULL,
	"efectivo" numeric(14, 2) DEFAULT '0' NOT NULL,
	"otro_medio" varchar(32),
	"otro_monto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"orden_id" integer,
	"cierre_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(256) NOT NULL,
	"nombre_fantasia" varchar(256),
	"tipo_documento" varchar(16) DEFAULT 'DNI',
	"dni" varchar(32),
	"cuit" varchar(16),
	"domicilio" text,
	"localidad" varchar(128),
	"tipo_responsable" varchar(64) DEFAULT 'Consumidor Final',
	"telefono" varchar(32),
	"telefono_alt" varchar(32),
	"email" varchar(128),
	"email_alt" varchar(128),
	"contacto" varchar(128),
	"comentario" text,
	"saldo_cuenta_corriente" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dirup_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orden_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orden_id" integer NOT NULL,
	"filename" varchar(256) NOT NULL,
	"mime_type" varchar(64),
	"storage_url" text NOT NULL,
	"size_bytes" bigint,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orden_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"orden_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"tipo" "item_tipo" NOT NULL,
	"importe" numeric(14, 2) NOT NULL,
	"cantidad" numeric(10, 2) DEFAULT '1' NOT NULL,
	"bonificacion_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"iva_pct" numeric(5, 2) DEFAULT '21' NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ordenes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comprobante" varchar(32) NOT NULL,
	"cliente_id" integer,
	"vehiculo_id" integer,
	"tecnico_id" integer,
	"concepto" "concepto" DEFAULT 'REPARACION',
	"combustible" "combustible",
	"kilometraje" integer,
	"categoria" varchar(4),
	"estado" "orden_estado" DEFAULT 'ingresado' NOT NULL,
	"pago_estado" "pago_estado" DEFAULT 'pendiente' NOT NULL,
	"fecha_ingreso" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_egreso" timestamp with time zone,
	"total_repuestos" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_mano_obra" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_neto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_iva" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_bruto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pago_efectivo" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pago_cuenta_corriente" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pago_otro_medio" varchar(32),
	"pago_otro_monto" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pago_comprobante" varchar(64),
	"observaciones" text,
	"comentario_interno" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"dirup_id" integer,
	CONSTRAINT "ordenes_comprobante_unique" UNIQUE("comprobante")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"nombre" varchar(128) NOT NULL,
	"email" varchar(128),
	"role" "role" DEFAULT 'mecanico' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehiculos" (
	"id" serial PRIMARY KEY NOT NULL,
	"dominio" varchar(16) NOT NULL,
	"marca" varchar(64),
	"modelo" varchar(128),
	"tipo" varchar(32),
	"color" varchar(32),
	"anio" integer,
	"kilometraje" integer,
	"combustible" varchar(16),
	"motor" varchar(64),
	"chasis" varchar(64),
	"comentario" text,
	"cliente_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dirup_id" integer,
	CONSTRAINT "vehiculos_dominio_unique" UNIQUE("dominio")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_cierres" ADD CONSTRAINT "caja_cierres_cerrado_por_users_id_fk" FOREIGN KEY ("cerrado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_movimientos" ADD CONSTRAINT "caja_movimientos_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_movimientos" ADD CONSTRAINT "caja_movimientos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_attachments" ADD CONSTRAINT "orden_attachments_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_attachments" ADD CONSTRAINT "orden_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_items" ADD CONSTRAINT "orden_items_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_vehiculo_id_vehiculos_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehiculos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_tecnico_id_users_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_fecha" ON "caja_movimientos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_orden" ON "caja_movimientos" USING btree ("orden_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_nombre" ON "clientes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_dni" ON "clientes" USING btree ("dni");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tel" ON "clientes" USING btree ("telefono");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orden_items_orden" ON "orden_items" USING btree ("orden_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_cliente" ON "ordenes" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_vehiculo" ON "ordenes" USING btree ("vehiculo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_estado" ON "ordenes" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_fecha" ON "ordenes" USING btree ("fecha_ingreso");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vehiculos_dominio" ON "vehiculos" USING btree ("dominio");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vehiculos_cliente" ON "vehiculos" USING btree ("cliente_id");