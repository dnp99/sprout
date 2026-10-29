CREATE TABLE "group_category_split_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"weight" integer NOT NULL,
	CONSTRAINT "group_category_split_weight_valid" CHECK ("group_category_split_weights"."weight" >= 0 AND "group_category_split_weights"."weight" <= 10000)
);
--> statement-breakpoint
CREATE TABLE "group_category_splits" (
	"category_id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"method" text NOT NULL,
	CONSTRAINT "group_category_split_method" CHECK ("group_category_splits"."method" IN ('equal', 'percentage'))
);
--> statement-breakpoint
ALTER TABLE "group_category_split_weights" ADD CONSTRAINT "group_category_split_weights_category_id_group_category_splits_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_category_splits"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_category_split_weights" ADD CONSTRAINT "group_category_split_weights_member_id_group_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_category_splits" ADD CONSTRAINT "group_category_splits_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_category_splits" ADD CONSTRAINT "group_category_splits_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_category_split_member_uq" ON "group_category_split_weights" USING btree ("category_id","member_id");--> statement-breakpoint
CREATE INDEX "group_category_splits_group_idx" ON "group_category_splits" USING btree ("group_id");