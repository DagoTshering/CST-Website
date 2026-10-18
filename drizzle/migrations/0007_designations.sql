CREATE TABLE "designations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "designations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "designation_id" integer;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Data: one designation per position in use. The position is the rank, or else the designation up
-- to its first "/" or " (" ("Assistant Lecturer (SHD)" -> "Assistant Lecturer").
INSERT INTO "designations" ("name")
SELECT DISTINCT coalesce(nullif(btrim("rank"), ''), btrim(regexp_replace("designation", '\s*[/(].*$', '')))
FROM "staff"
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
UPDATE "staff" AS s
SET "designation_id" = d."id"
FROM "designations" AS d
WHERE d."name" = coalesce(nullif(btrim(s."rank"), ''), btrim(regexp_replace(s."designation", '\s*[/(].*$', '')));
