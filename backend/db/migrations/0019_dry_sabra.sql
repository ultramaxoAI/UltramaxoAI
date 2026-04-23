CREATE TABLE IF NOT EXISTS "agent_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"mode" varchar NOT NULL,
	"goal" text NOT NULL,
	"plan" json DEFAULT '[]'::json NOT NULL,
	"deliverable" text NOT NULL,
	"status" varchar DEFAULT 'running' NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"runId" uuid NOT NULL,
	"title" text NOT NULL,
	"status" varchar DEFAULT 'in_progress' NOT NULL,
	"detail" text NOT NULL,
	"files" json DEFAULT '[]'::json NOT NULL,
	"packages" json DEFAULT '[]'::json NOT NULL,
	"command" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_step" ADD CONSTRAINT "agent_step_runId_agent_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."agent_run"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
