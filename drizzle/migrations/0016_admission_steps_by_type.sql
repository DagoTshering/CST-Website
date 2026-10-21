DROP INDEX "admission_steps_mark_unique";--> statement-breakpoint
ALTER TABLE "admission_steps" ALTER COLUMN "step_type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_steps" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "admission_steps" DROP COLUMN "mark";--> statement-breakpoint
ALTER TABLE "admission_steps" ADD CONSTRAINT "admission_steps_step_type_id_unique" UNIQUE("step_type_id");