CREATE TYPE "public"."vacancy_category" AS ENUM('job_vacancy', 'recruitment_notice', 'shortlist', 'interview_schedule', 'examination_result', 'final_selection', 'other');--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vacancies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(300) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"category" "vacancy_category" NOT NULL,
	"content" jsonb NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"attachment_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vacancies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "vacancies_slug_format" CHECK ("vacancies"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "vacancies_published_at" CHECK ("vacancies"."status" = 'draft' or "vacancies"."published_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vacancies_public_idx" ON "vacancies" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "vacancies_category_idx" ON "vacancies" USING btree ("category","status","published_at");