CREATE TABLE IF NOT EXISTS "prompt_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"modelId" text,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"webSearchEnabled" boolean DEFAULT true NOT NULL,
	"deepThinkingEnabled" boolean DEFAULT false NOT NULL,
	"fullstackModeEnabled" boolean DEFAULT false NOT NULL,
	"mobileModeEnabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "maintenanceTitle" SET DEFAULT 'We will be right back.';--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "folder" text;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "tags" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "isShared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prompt_preset" ADD CONSTRAINT "prompt_preset_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
