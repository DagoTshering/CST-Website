CREATE TYPE "public"."department_kind" AS ENUM('department', 'administration');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "departments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(12) NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" "department_kind" DEFAULT 'department' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "executives" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "executives_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"role" varchar(80) NOT NULL,
	"scope" varchar(160),
	"level" smallint DEFAULT 2 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"staff_id" integer,
	"photo_id" uuid,
	"photo_alt" varchar(300),
	"biography" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"legacy_key" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "executives_legacy_key_unique" UNIQUE("legacy_key"),
	CONSTRAINT "executives_level" CHECK ("executives"."level" in (1, 2))
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staff_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"designation" varchar(200) NOT NULL,
	"rank" varchar(120),
	"duties" text[] DEFAULT '{}'::text[] NOT NULL,
	"department_id" integer NOT NULL,
	"email" varchar(320),
	"photo_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"legacy_key" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_legacy_key_unique" UNIQUE("legacy_key")
);
--> statement-breakpoint
CREATE TABLE "staff_programmes" (
	"staff_id" integer NOT NULL,
	"programme_id" integer NOT NULL,
	CONSTRAINT "staff_programmes_staff_id_programme_id_pk" PRIMARY KEY("staff_id","programme_id")
);
--> statement-breakpoint
ALTER TABLE "executives" ADD CONSTRAINT "executives_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executives" ADD CONSTRAINT "executives_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_programmes" ADD CONSTRAINT "staff_programmes_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_programmes" ADD CONSTRAINT "staff_programmes_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "executives_public_idx" ON "executives" USING btree ("status","level","sort_order");--> statement-breakpoint
CREATE INDEX "staff_public_idx" ON "staff" USING btree ("status","department_id","sort_order");--> statement-breakpoint
CREATE INDEX "staff_programmes_programme_idx" ON "staff_programmes" USING btree ("programme_id");