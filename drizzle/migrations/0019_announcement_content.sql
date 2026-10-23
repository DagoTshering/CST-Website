ALTER TABLE "announcements" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "content" jsonb;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_slug_unique" UNIQUE("slug");