CREATE TABLE "vacancy_slug_redirects" (
	"slug" varchar(160) PRIMARY KEY NOT NULL,
	"vacancy_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vacancy_slug_redirects" ADD CONSTRAINT "vacancy_slug_redirects_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;