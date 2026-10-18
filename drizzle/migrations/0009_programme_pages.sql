CREATE TABLE "admission_details" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"required_documents" text NOT NULL,
	"admission_url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_details_single_row" CHECK ("admission_details"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "programme_facilities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "programme_facilities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programme_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programme_modules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "programme_modules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programme_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"code" varchar(40),
	"description_confirmed" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "start_month" smallint;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "slug" varchar(80);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "short_name" varchar(120);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "degree" varchar(160);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "duration" varchar(40);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "department_id" integer;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "website_url" varchar(500);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "document_url" varchar(500);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "outcomes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "requirements" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "selection_note" text;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "careers" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "structure_intro" text;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "structure_note" text;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "image2_id" uuid;--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "image3_id" uuid;--> statement-breakpoint
ALTER TABLE "programme_facilities" ADD CONSTRAINT "programme_facilities_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme_modules" ADD CONSTRAINT "programme_modules_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "programme_facilities_programme_idx" ON "programme_facilities" USING btree ("programme_id","sort_order");--> statement-breakpoint
CREATE INDEX "programme_modules_programme_idx" ON "programme_modules" USING btree ("programme_id","sort_order");--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_image2_id_media_id_fk" FOREIGN KEY ("image2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_image3_id_media_id_fk" FOREIGN KEY ("image3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_start_month" CHECK ("programmes"."start_month" is null or "programmes"."start_month" between 1 and 12);