CREATE TABLE IF NOT EXISTS "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(256) NOT NULL,
	"cuit" varchar(16),
	"telefono" varchar(32),
	"email" varchar(128),
	"direccion" text,
	"rubro" varchar(64),
	"comentario" text,
	"saldo" numeric(14, 2) DEFAULT '0' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prov_nombre" ON "proveedores" USING btree ("nombre");