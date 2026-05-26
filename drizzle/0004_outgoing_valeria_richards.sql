ALTER TABLE "caja_movimientos" ADD COLUMN "categoria" varchar(64);--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "origen" varchar(32) DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "vehiculo" varchar(128);--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "proveedor" varchar(128);--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "cliente_ref" varchar(128);--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "fecha_movimiento" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "caja_movimientos" ADD COLUMN "notion_id" varchar(64);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_categoria" ON "caja_movimientos" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caja_notion" ON "caja_movimientos" USING btree ("notion_id");