CREATE TABLE "group_split_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"weight" integer NOT NULL,
	CONSTRAINT "group_split_weight_valid" CHECK ("group_split_defaults"."weight" >= 0 AND "group_split_defaults"."weight" <= 10000)
);
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "split_method" text DEFAULT 'equal' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_split_defaults" ADD CONSTRAINT "group_split_defaults_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_split_defaults" ADD CONSTRAINT "group_split_defaults_member_id_group_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_split_defaults_member_uq" ON "group_split_defaults" USING btree ("group_id","member_id");