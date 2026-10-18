ALTER TABLE "staff" ALTER COLUMN "designation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" DROP COLUMN "designation";--> statement-breakpoint
ALTER TABLE "staff" DROP COLUMN "rank";