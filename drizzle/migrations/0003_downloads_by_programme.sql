ALTER TABLE "download_categories" ADD COLUMN "group_by_programme" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "downloads" ADD COLUMN "programme_id" integer;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "downloads_programme_idx" ON "downloads" USING btree ("programme_id");--> statement-breakpoint
-- Data: the students' project reports are grouped by programme. Reports imported from the old
-- site name their department ("Civil Engineering", "ME Renewable Energy"); link each to the
-- programme whose name ends with it. Unmatched rows keep their group label.
UPDATE "download_categories" SET "group_by_programme" = true WHERE "name" = 'Students Project Reports';--> statement-breakpoint
UPDATE "downloads" AS d
SET "programme_id" = p."id", "group_label" = NULL
FROM "download_categories" AS c, "programmes" AS p
WHERE c."id" = d."category_id"
  AND c."group_by_programme"
  AND d."programme_id" IS NULL
  AND d."group_label" IS NOT NULL
  AND lower(p."name") LIKE '%' || lower(regexp_replace(d."group_label", '^ME ', ''));
