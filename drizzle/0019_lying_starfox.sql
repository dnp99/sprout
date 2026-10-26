CREATE TABLE "group_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_id" uuid,
	"detail" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_budget_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	CONSTRAINT "group_allocation_nonnegative" CHECK ("group_budget_allocations"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "group_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"month" text NOT NULL,
	"pool_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_budget_nonnegative" CHECK ("group_budgets"."pool_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "group_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"color" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"payer_id" uuid,
	"category_id" uuid,
	"kind" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"merchant" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"occurred_on" date NOT NULL,
	"refund_of" uuid,
	"settlement" boolean DEFAULT true NOT NULL,
	"split_method" text DEFAULT 'equal' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_entry_sign" CHECK (("group_entries"."kind" = 'expense' AND "group_entries"."amount_cents" < 0) OR ("group_entries"."kind" IN ('income', 'refund') AND "group_entries"."amount_cents" > 0))
);
--> statement-breakpoint
CREATE TABLE "group_entry_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"weight" integer NOT NULL,
	CONSTRAINT "group_share_nonnegative" CHECK ("group_entry_shares"."amount_cents" >= 0 AND "group_entry_shares"."weight" >= 0)
);
--> statement-breakpoint
CREATE TABLE "group_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" uuid NOT NULL,
	"reactivate_member_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_mutations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"key" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"result" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_repayments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recorded_by" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"occurred_on" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"reversed_at" timestamp with time zone,
	"reversal_reason" text,
	"reversed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_repayment_valid" CHECK ("group_repayments"."amount_cents" > 0 AND "group_repayments"."sender_id" <> "group_repayments"."recipient_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_activity" ADD CONSTRAINT "group_activity_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_activity" ADD CONSTRAINT "group_activity_actor_id_group_members_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_budget_allocations" ADD CONSTRAINT "group_budget_allocations_budget_id_group_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."group_budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_budget_allocations" ADD CONSTRAINT "group_budget_allocations_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_budgets" ADD CONSTRAINT "group_budgets_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_categories" ADD CONSTRAINT "group_categories_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entries" ADD CONSTRAINT "group_entries_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entries" ADD CONSTRAINT "group_entries_author_id_group_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entries" ADD CONSTRAINT "group_entries_payer_id_group_members_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entries" ADD CONSTRAINT "group_entries_category_id_group_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."group_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entry_shares" ADD CONSTRAINT "group_entry_shares_entry_id_group_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."group_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entry_shares" ADD CONSTRAINT "group_entry_shares_member_id_group_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_created_by_group_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_reactivate_member_id_group_members_id_fk" FOREIGN KEY ("reactivate_member_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_mutations" ADD CONSTRAINT "group_mutations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_mutations" ADD CONSTRAINT "group_mutations_actor_id_group_members_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_repayments" ADD CONSTRAINT "group_repayments_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_repayments" ADD CONSTRAINT "group_repayments_sender_id_group_members_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_repayments" ADD CONSTRAINT "group_repayments_recipient_id_group_members_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_repayments" ADD CONSTRAINT "group_repayments_recorded_by_group_members_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_repayments" ADD CONSTRAINT "group_repayments_reversed_by_group_members_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."group_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_activity_group_idx" ON "group_activity" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "group_budget_category_uq" ON "group_budget_allocations" USING btree ("budget_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_budgets_month_uq" ON "group_budgets" USING btree ("group_id","month");--> statement-breakpoint
CREATE INDEX "group_categories_group_idx" ON "group_categories" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_entries_date_idx" ON "group_entries" USING btree ("group_id","occurred_on");--> statement-breakpoint
CREATE INDEX "group_entries_refund_idx" ON "group_entries" USING btree ("refund_of");--> statement-breakpoint
CREATE UNIQUE INDEX "group_entry_member_uq" ON "group_entry_shares" USING btree ("entry_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_user_uq" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_owner_uq" ON "group_members" USING btree ("group_id") WHERE "group_members"."role" = 'owner' AND "group_members"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "group_mutations_actor_key_uq" ON "group_mutations" USING btree ("group_id","actor_id","key");--> statement-breakpoint
CREATE INDEX "group_repayments_date_idx" ON "group_repayments" USING btree ("group_id","occurred_on");