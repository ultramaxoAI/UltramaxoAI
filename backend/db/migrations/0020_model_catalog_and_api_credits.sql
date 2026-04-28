CREATE TABLE IF NOT EXISTS "api_credit_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"balanceCents" integer DEFAULT 0 NOT NULL,
	"lifetimeGrantedCents" integer DEFAULT 0 NOT NULL,
	"lifetimeSpentCents" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_credit_account_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_credit_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"amountCents" integer NOT NULL,
	"balanceAfterCents" integer NOT NULL,
	"type" varchar DEFAULT 'spend' NOT NULL,
	"reason" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modelId" text NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"context" text,
	"priceIn" numeric(12, 6),
	"priceOut" numeric(12, 6),
	"priceUnit" text DEFAULT 'per_1m' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"isFree" boolean DEFAULT false NOT NULL,
	"capabilities" json DEFAULT '[]'::json,
	"status" varchar DEFAULT 'active' NOT NULL,
	"raw" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_catalog_modelId_unique" UNIQUE("modelId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_catalog_refresh_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar DEFAULT 'success' NOT NULL,
	"message" text,
	"refreshedAt" timestamp DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_credit_account" ADD CONSTRAINT "api_credit_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_credit_transaction" ADD CONSTRAINT "api_credit_transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
