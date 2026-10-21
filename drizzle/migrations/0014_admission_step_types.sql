CREATE TABLE "admission_step_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_step_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(120) NOT NULL,
	"mark" "admission_step_mark",
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_step_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "admission_steps" ADD COLUMN "step_type_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "admission_step_types_mark_unique" ON "admission_step_types" USING btree ("mark");--> statement-breakpoint
ALTER TABLE "admission_steps" ADD CONSTRAINT "admission_steps_step_type_id_admission_step_types_id_fk" FOREIGN KEY ("step_type_id") REFERENCES "public"."admission_step_types"("id") ON DELETE restrict ON UPDATE no action;