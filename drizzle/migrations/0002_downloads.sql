CREATE TYPE "public"."download_kind" AS ENUM('file', 'link');--> statement-breakpoint
CREATE TABLE "download_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "download_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "download_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "downloads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(300) NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"group_label" varchar(120),
	"kind" "download_kind" NOT NULL,
	"file_id" uuid,
	"external_url" varchar(2000),
	"published_on" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"legacy_key" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "downloads_legacy_key_unique" UNIQUE("legacy_key"),
	CONSTRAINT "downloads_file_or_link" CHECK (("downloads"."kind" = 'file' and "downloads"."file_id" is not null and "downloads"."external_url" is null)
        or ("downloads"."kind" = 'link' and "downloads"."file_id" is null and "downloads"."external_url" like 'https://%'))
);
--> statement-breakpoint
CREATE TABLE "seed_tombstones" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_category_id_download_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."download_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "downloads_public_idx" ON "downloads" USING btree ("status","category_id","sort_order");