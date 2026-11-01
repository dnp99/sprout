CREATE TABLE "group_merchant_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"pattern" text NOT NULL,
	"label" text NOT NULL,
	"category_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_merchant_rules" ADD CONSTRAINT "group_merchant_rules_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_merchant_rules" ADD CONSTRAINT "group_merchant_rules_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_merchant_rules_group_pattern_uq" ON "group_merchant_rules" USING btree ("group_id","pattern");