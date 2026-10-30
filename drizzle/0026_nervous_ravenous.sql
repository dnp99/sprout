CREATE TABLE "group_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"color" text NOT NULL,
	"target_cents" integer NOT NULL,
	"saved_cents" integer DEFAULT 0 NOT NULL,
	"target_date" date,
	"is_roundup_target" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_recurring_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"cadence" text DEFAULT 'monthly' NOT NULL,
	"day_of_month" integer NOT NULL,
	"day_of_week" integer,
	"month_of_year" integer,
	"paused" boolean DEFAULT false NOT NULL,
	"category_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_entries" ADD COLUMN "recurring_item_id" uuid;--> statement-breakpoint
ALTER TABLE "group_entries" ADD COLUMN "roundup_swept_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_goals" ADD CONSTRAINT "group_goals_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_recurring_items" ADD CONSTRAINT "group_recurring_items_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_recurring_items" ADD CONSTRAINT "group_recurring_items_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entries" ADD CONSTRAINT "group_entries_recurring_item_id_group_recurring_items_id_fk" FOREIGN KEY ("recurring_item_id") REFERENCES "public"."group_recurring_items"("id") ON DELETE set null ON UPDATE no action;