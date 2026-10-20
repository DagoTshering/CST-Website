CREATE TYPE "public"."centre_group" AS ENUM('research', 'innovation');--> statement-breakpoint
CREATE TABLE "about_page" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"intro_heading" varchar(200) NOT NULL,
	"intro_emphasis" varchar(80),
	"intro_text" text NOT NULL,
	"intro_image_id" uuid,
	"intro_image_alt" varchar(300),
	"names_heading" varchar(200) NOT NULL,
	"names_emphasis" varchar(80),
	"names_text" text,
	"vision" varchar(300) NOT NULL,
	"vision_emphasis" varchar(80),
	"vision_text" text,
	"pillars" text[] DEFAULT '{}'::text[] NOT NULL,
	"offer_heading" varchar(200) NOT NULL,
	"offer_emphasis" varchar(80),
	"offer_text" text,
	"planned_programme" varchar(120),
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"centres_heading" varchar(200) NOT NULL,
	"centres_emphasis" varchar(80),
	"centres_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "about_page_single_row" CHECK ("about_page"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "college_names" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "college_names_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" smallint NOT NULL,
	"name" varchar(200) NOT NULL,
	"note" varchar(120),
	"image_id" uuid,
	"image_alt" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_names_year" CHECK ("college_names"."year" between 1900 and 2100)
);
--> statement-breakpoint
CREATE TABLE "research_centres" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "research_centres_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"centre_group" "centre_group" NOT NULL,
	"acronym" varchar(80) NOT NULL,
	"full_name" varchar(200),
	"description" text,
	"website_url" varchar(500),
	"email" varchar(254),
	"image_id" uuid,
	"image_alt" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "about_page" ADD CONSTRAINT "about_page_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_names" ADD CONSTRAINT "college_names_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_centres" ADD CONSTRAINT "research_centres_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "college_names_year_idx" ON "college_names" USING btree ("year");--> statement-breakpoint
CREATE INDEX "research_centres_public_idx" ON "research_centres" USING btree ("status","centre_group","sort_order");