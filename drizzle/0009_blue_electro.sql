CREATE TYPE "public"."tenant_plan" AS ENUM('trial', 'web', 'bot', 'enterprise');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'owner' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(32) NOT NULL,
	"nombre" varchar(128) NOT NULL,
	"nombre_fantasia" varchar(128),
	"cuit" varchar(16),
	"domicilio" text,
	"localidad" varchar(64),
	"telefono" varchar(32),
	"email_contacto" varchar(128),
	"logo_url" text,
	"color_primary" varchar(7) DEFAULT '#2563eb' NOT NULL,
	"plan" "tenant_plan" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"subscription_id" varchar(64),
	"evo_instance_name" varchar(64),
	"wa_admin_jid" varchar(64),
	"wa_turnos_jid" varchar(64),
	"wa_taller_jid" varchar(64),
	"wa_allowlist_phones" text,
	"bot_token" varchar(128),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ordenes" DROP CONSTRAINT "ordenes_comprobante_unique";--> statement-breakpoint
ALTER TABLE "referidos_codigos" DROP CONSTRAINT "referidos_codigos_codigo_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "vehiculos" DROP CONSTRAINT "vehiculos_dominio_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_audit_user";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_audit_entity";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_fecha";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_orden";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_categoria";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_caja_notion";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_nombre";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_dni";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_clientes_tel";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_inv_nombre";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_inv_tipo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_orden_items_orden";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_orden_items_inv";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ordenes_cliente";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ordenes_vehiculo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ordenes_estado";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ordenes_fecha";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ordenes_presupuesto";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_prov_nombre";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_rec_fecha";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_rec_estado";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_rec_cliente";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_referidos_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ref_act_fecha";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ref_codigo";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_ref_cliente";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_turnos_fecha";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_turnos_tecnico";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_vehiculos_dominio";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_vehiculos_cliente";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'config'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "config" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "inventario_items" ALTER COLUMN "iva_pct" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orden_items" ALTER COLUMN "iva_pct" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "caja_cierres" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "inventario_items" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orden_attachments" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orden_items" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "ordenes" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "recordatorios" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "referidos" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "referidos_actividad" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "referidos_codigos" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "turnos" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "vehiculos" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_evo" ON "tenants" USING btree ("evo_instance_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_wa_admin" ON "tenants" USING btree ("wa_admin_jid");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_cierres" ADD CONSTRAINT "caja_cierres_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caja_movimientos" ADD CONSTRAINT "caja_movimientos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "config" ADD CONSTRAINT "config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_attachments" ADD CONSTRAINT "orden_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_items" ADD CONSTRAINT "orden_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos" ADD CONSTRAINT "referidos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos_actividad" ADD CONSTRAINT "referidos_actividad_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos_codigos" ADD CONSTRAINT "referidos_codigos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_tenant_user" ON "audit_log" USING btree ("tenant_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_tenant_entity" ON "audit_log" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cierres_tenant" ON "caja_cierres" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_tenant_fecha" ON "caja_movimientos" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_tenant_orden" ON "caja_movimientos" USING btree ("tenant_id","orden_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tenant_nombre" ON "clientes" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tenant_dni" ON "clientes" USING btree ("tenant_id","dni");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clientes_tenant_tel" ON "clientes" USING btree ("tenant_id","telefono");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pk_config_tenant_key" ON "config" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_tenant_nombre" ON "inventario_items" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_tenant_tipo" ON "inventario_items" USING btree ("tenant_id","tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attachments_tenant" ON "orden_attachments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orden_items_tenant_orden" ON "orden_items" USING btree ("tenant_id","orden_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ordenes_tenant_comprobante" ON "ordenes" USING btree ("tenant_id","comprobante");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_tenant_cliente" ON "ordenes" USING btree ("tenant_id","cliente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_tenant_vehiculo" ON "ordenes" USING btree ("tenant_id","vehiculo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_tenant_estado" ON "ordenes" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_tenant_fecha" ON "ordenes" USING btree ("tenant_id","fecha_ingreso");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prov_tenant_nombre" ON "proveedores" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rec_tenant_fecha" ON "recordatorios" USING btree ("tenant_id","fecha_programada");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rec_tenant_estado" ON "recordatorios" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_referidos_tenant_codigo" ON "referidos" USING btree ("tenant_id","codigo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ref_act_tenant_fecha" ON "referidos_actividad" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ref_tenant_codigo" ON "referidos_codigos" USING btree ("tenant_id","codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_tenant" ON "sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_turnos_tenant_fecha" ON "turnos" USING btree ("tenant_id","fecha_inicio");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_tenant_username" ON "users" USING btree ("tenant_id","username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_vehiculos_tenant_dominio" ON "vehiculos" USING btree ("tenant_id","dominio");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vehiculos_tenant_cliente" ON "vehiculos" USING btree ("tenant_id","cliente_id");