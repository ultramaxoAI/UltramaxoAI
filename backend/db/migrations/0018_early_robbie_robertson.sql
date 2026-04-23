CREATE TABLE IF NOT EXISTS "user_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"category" varchar DEFAULT 'instruction' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_memory" ADD CONSTRAINT "user_memory_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
