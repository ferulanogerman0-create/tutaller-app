CREATE TABLE IF NOT EXISTS "config" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "config" ADD CONSTRAINT "config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
