CREATE TABLE "contact_offices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_offices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"email" varchar(254),
	"phone" varchar(40),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_offices_reachable" CHECK ("contact_offices"."email" is not null or "contact_offices"."phone" is not null)
);
--> statement-breakpoint
CREATE TABLE "contact_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"intro" varchar(400) NOT NULL,
	"banner_image_id" uuid,
	"banner_image_alt" varchar(300),
	"address_lines" text[] NOT NULL,
	"postal" varchar(200),
	"map_link" varchar(500) NOT NULL,
	"map_embed" varchar(1000) NOT NULL,
	"open_days" smallint[] NOT NULL,
	"opens_at" varchar(5) NOT NULL,
	"closes_at" varchar(5) NOT NULL,
	"phone" varchar(40),
	"phone_note" varchar(120),
	"email" varchar(254),
	"whatsapp_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_settings_single_row" CHECK ("contact_settings"."id" = 1),
	CONSTRAINT "contact_settings_hours_in_order" CHECK ("contact_settings"."opens_at" < "contact_settings"."closes_at")
);
--> statement-breakpoint
CREATE TABLE "contact_social_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_social_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" varchar(60) NOT NULL,
	"url" varchar(500) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_social_links_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "contact_settings" ADD CONSTRAINT "contact_settings_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;