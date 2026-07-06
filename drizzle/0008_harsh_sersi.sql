ALTER TABLE "goals" ADD COLUMN "is_roundup_target" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "roundup_swept_at" timestamp with time zone;