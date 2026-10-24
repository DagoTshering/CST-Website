CREATE TABLE "important_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "important_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" varchar(80) NOT NULL,
	"url" varchar(500) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "important_links_url_unique" UNIQUE("url")
);
--> statement-breakpoint
-- The links the menu listed before they were managed in the admin panel; added once, here, so a
-- link an administrator deletes does not come back.
INSERT INTO "important_links" ("label", "url", "sort_order", "status") VALUES
	('Research', 'https://ril.cst.edu.bt/', 10, 'published'),
	('Student Life', 'https://sa.cst.edu.bt/', 20, 'published'),
	('Hostel Booking', 'https://hostel.cst.edu.bt/login', 30, 'published'),
	('CST-25', 'https://cst25.cst.edu.bt/', 40, 'published');
