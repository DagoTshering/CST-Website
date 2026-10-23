ALTER TABLE "announcements" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_slug_format" CHECK ("announcements"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');