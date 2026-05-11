CREATE TABLE "api_credit_account" (
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
CREATE TABLE "api_credit_transaction" (
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
CREATE TABLE "inbox_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" text NOT NULL,
	"fromEmail" text NOT NULL,
	"fromName" text,
	"toEmail" text NOT NULL,
	"subject" text,
	"textBody" text,
	"htmlBody" text,
	"status" varchar DEFAULT 'unread' NOT NULL,
	"threadId" text,
	"replyToMessageId" text,
	"receivedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inbox_message_messageId_unique" UNIQUE("messageId")
);
--> statement-breakpoint
CREATE TABLE "model_catalog" (
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
CREATE TABLE "model_catalog_refresh_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar DEFAULT 'success' NOT NULL,
	"message" text,
	"refreshedAt" timestamp DEFAULT now() NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text DEFAULT 'Default Key' NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp,
	CONSTRAINT "platform_api_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "redeem_code_claims" (
	"redeemCodeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redeem_code_claims_redeemCodeId_userId_pk" PRIMARY KEY("redeemCodeId","userId")
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"message" text NOT NULL,
	"source" varchar DEFAULT 'timed_prompt' NOT NULL,
	"status" varchar DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_knowledge_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"category" varchar DEFAULT 'project' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source" text,
	"workspace" text,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "redeem_codes" ADD COLUMN "maxClaims" integer;--> statement-breakpoint
ALTER TABLE "redeem_codes" ADD COLUMN "claimedCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "chatAnnouncementEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "chatAnnouncementTitle" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "chatAnnouncementMessage" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "api_credit_account" ADD CONSTRAINT "api_credit_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_credit_transaction" ADD CONSTRAINT "api_credit_transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_api_key" ADD CONSTRAINT "platform_api_key_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_code_claims" ADD CONSTRAINT "redeem_code_claims_redeemCodeId_redeem_codes_id_fk" FOREIGN KEY ("redeemCodeId") REFERENCES "public"."redeem_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redeem_code_claims" ADD CONSTRAINT "redeem_code_claims_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_knowledge_entry" ADD CONSTRAINT "user_knowledge_entry_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;