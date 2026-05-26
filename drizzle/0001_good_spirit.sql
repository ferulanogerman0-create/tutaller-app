CREATE TYPE "public"."premio_tipo" AS ENUM('aceite', 'descuento', 'eleccion');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_id" integer NOT NULL,
	"nombre" varchar(256) NOT NULL,
	"servicio" text,
	"vehiculo_dominio" varchar(16),
	"orden_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referidos_actividad" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(32) NOT NULL,
	"texto" text NOT NULL,
	"sub" text,
	"codigo_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referidos_codigos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(16) NOT NULL,
	"cliente_id" integer NOT NULL,
	"premio_tipo" "premio_tipo" DEFAULT 'aceite' NOT NULL,
	"servicio_inicial" text,
	"premiado" boolean DEFAULT false NOT NULL,
	"premiado_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referidos_codigos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos" ADD CONSTRAINT "referidos_codigo_id_referidos_codigos_id_fk" FOREIGN KEY ("codigo_id") REFERENCES "public"."referidos_codigos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos" ADD CONSTRAINT "referidos_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos_actividad" ADD CONSTRAINT "referidos_actividad_codigo_id_referidos_codigos_id_fk" FOREIGN KEY ("codigo_id") REFERENCES "public"."referidos_codigos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "referidos_codigos" ADD CONSTRAINT "referidos_codigos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_referidos_codigo" ON "referidos" USING btree ("codigo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ref_act_fecha" ON "referidos_actividad" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ref_codigo" ON "referidos_codigos" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ref_cliente" ON "referidos_codigos" USING btree ("cliente_id");