CREATE TABLE "group_category_split_rules" (
	"category_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"participants" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_split_results" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"review" text DEFAULT 'current' NOT NULL,
	"reviewed_version" integer NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "group_category_split_rules" ADD CONSTRAINT "group_category_split_rules_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_category_split_rules" ADD CONSTRAINT "group_category_split_rules_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_split_results" ADD CONSTRAINT "group_split_results_entry_id_group_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."group_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_split_results" ADD CONSTRAINT "group_split_results_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_categories" ADD CONSTRAINT "group_categories_parent_id_group_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."group_categories"("id") ON DELETE no action ON UPDATE no action;