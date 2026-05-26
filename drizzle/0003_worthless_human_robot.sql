CREATE TYPE "public"."recordatorio_estado" AS ENUM('pendiente', 'enviado', 'completado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."recordatorio_tipo" AS ENUM('service', 'cambio_aceite', 'revision', 'vtv', 'seguro', 'otro');--> statement-breakpoint
CREATE TYPE "public"."turno_estado" AS ENUM('agendado', 'confirmado', 'en_proceso', 'completado', 'cancelado');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recordatorios" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "recordatorio_tipo" DEFAULT 'service' NOT NULL,
	"titulo" varchar(256) NOT NULL,
	"detalle" text,
	"cliente_id" integer,
	"vehiculo_id" integer,
	"orden_id" integer,
	"fecha_programada" timestamp with time zone NOT NULL,
	"kilometraje_programado" integer,
	"estado" "recordatorio_estado" DEFAULT 'pendiente' NOT NULL,
	"enviado_at" timestamp with time zone,
	"completado_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turnos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(256) NOT NULL,
	"detalle" text,
	"cliente_id" integer,
	"vehiculo_id" integer,
	"tecnico_id" integer,
	"orden_id" integer,
	"fecha_inicio" timestamp with time zone NOT NULL,
	"fecha_fin" timestamp with time zone,
	"estado" "turno_estado" DEFAULT 'agendado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_vehiculo_id_vehiculos_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehiculos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_vehiculo_id_vehiculos_id_fk" FOREIGN KEY ("vehiculo_id") REFERENCES "public"."vehiculos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_tecnico_id_users_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turnos" ADD CONSTRAINT "turnos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rec_fecha" ON "recordatorios" USING btree ("fecha_programada");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rec_estado" ON "recordatorios" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rec_cliente" ON "recordatorios" USING btree ("cliente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_turnos_fecha" ON "turnos" USING btree ("fecha_inicio");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_turnos_tecnico" ON "turnos" USING btree ("tecnico_id");