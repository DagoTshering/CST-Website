-- Each distinct step title of the important dates becomes a step (with its opens/closes mark),
-- in order of its first date, and each date is linked to its step.
INSERT INTO "admission_step_types" ("name", "mark", "sort_order")
SELECT "title",
       (array_agg("mark" ORDER BY "mark" NULLS LAST))[1],
       (row_number() OVER (ORDER BY min("start_date"), min("id"))) * 10
FROM "admission_steps"
GROUP BY "title";--> statement-breakpoint
UPDATE "admission_steps" AS s
SET "step_type_id" = t."id"
FROM "admission_step_types" AS t
WHERE t."name" = s."title";
