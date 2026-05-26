CREATE TABLE IF NOT EXISTS "inventario_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(32),
	"nombre" text NOT NULL,
	"tipo" "item_tipo" NOT NULL,
	"precio" numeric(14, 2) DEFAULT '0' NOT NULL,
	"categoria" varchar(64),
	"stock" integer,
	"unidad_medida" varchar(16) DEFAULT 'UNIDAD',
	"iva_pct" numeric(5, 2) DEFAULT '21' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ordenes" ADD COLUMN "es_presupuesto" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ordenes" ADD COLUMN "presupuesto_aprobado_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_nombre" ON "inventario_items" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inv_tipo" ON "inventario_items" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ordenes_presupuesto" ON "ordenes" USING btree ("es_presupuesto");