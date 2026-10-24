CREATE TYPE "public"."partner_category" AS ENUM('international', 'national');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('university', 'research', 'government', 'industry', 'foundation', 'programme', 'finance');--> statement-breakpoint
CREATE TABLE "partners" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "partners_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(200) NOT NULL,
	"category" "partner_category" NOT NULL,
	"type" "partner_type" NOT NULL,
	"city" varchar(120),
	"country" varchar(120) NOT NULL,
	"note" varchar(200),
	"website_url" varchar(500),
	"logo_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partners_public_idx" ON "partners" USING btree ("status","category","sort_order");