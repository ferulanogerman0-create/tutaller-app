ALTER TABLE "orden_items" ADD COLUMN "inventario_item_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orden_items" ADD CONSTRAINT "orden_items_inventario_item_id_inventario_items_id_fk" FOREIGN KEY ("inventario_item_id") REFERENCES "public"."inventario_items"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orden_items_inv" ON "orden_items" USING btree ("inventario_item_id");