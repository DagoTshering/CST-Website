CREATE TYPE "public"."admission_status" AS ENUM('upcoming', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."admission_step_mark" AS ENUM('opens', 'closes');--> statement-breakpoint
CREATE TABLE "admission_faqs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_faqs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question" varchar(300) NOT NULL,
	"answer" text NOT NULL,
	"link_label" varchar(120),
	"link_url" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_programmes" (
	"programme_id" integer PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"intake" varchar(40) NOT NULL,
	"status_override" "admission_status",
	"next_intake_note" varchar(200),
	"apply_url" varchar(500),
	"intro" text NOT NULL,
	"hero_image_id" uuid,
	"hero_image_alt" varchar(300),
	"eligibility_checklist" text[] DEFAULT '{}'::text[] NOT NULL,
	"lab_image_id" uuid,
	"lab_image_alt" varchar(300),
	"lab_caption" varchar(200),
	"documents_intro" text,
	"documents_checklist" text[] DEFAULT '{}'::text[] NOT NULL,
	"criteria_label" varchar(200),
	"criteria_url" varchar(500),
	"office_image_id" uuid,
	"office_image_alt" varchar(300),
	"office_caption" varchar(200),
	"contact_email" varchar(254),
	"contact_phone" varchar(40),
	"contact_hours" varchar(120),
	"contact_address" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_settings_single_row" CHECK ("admission_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "admission_steps" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_steps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(120) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"mark" "admission_step_mark",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_steps_dates" CHECK ("admission_steps"."end_date" >= "admission_steps"."start_date")
);
--> statement-breakpoint
CREATE TABLE "admission_tracks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_tracks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(80) NOT NULL,
	"test_type" varchar(80) NOT NULL,
	"groups" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_programmes" ADD CONSTRAINT "admission_programmes_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_programmes" ADD CONSTRAINT "admission_programmes_track_id_admission_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."admission_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_settings" ADD CONSTRAINT "admission_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_settings" ADD CONSTRAINT "admission_settings_lab_image_id_media_id_fk" FOREIGN KEY ("lab_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_settings" ADD CONSTRAINT "admission_settings_office_image_id_media_id_fk" FOREIGN KEY ("office_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_faqs_public_idx" ON "admission_faqs" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "admission_steps_date_idx" ON "admission_steps" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_steps_mark_unique" ON "admission_steps" USING btree ("mark");