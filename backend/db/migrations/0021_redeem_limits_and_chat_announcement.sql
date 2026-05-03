ALTER TABLE "redeem_codes"
	ADD COLUMN IF NOT EXISTS "maxClaims" integer;
--> statement-breakpoint
ALTER TABLE "redeem_codes"
	ADD COLUMN IF NOT EXISTS "claimedCount" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "redeem_codes"
SET "claimedCount" = CASE
	WHEN "usedBy" IS NOT NULL OR "isUsed" = true THEN 1
	ELSE 0
END
WHERE "claimedCount" = 0;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redeem_code_claims" (
	"redeemCodeId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redeem_code_claims_redeemCodeId_userId_pk" PRIMARY KEY("redeemCodeId","userId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_code_claims" ADD CONSTRAINT "redeem_code_claims_redeemCodeId_redeem_codes_id_fk" FOREIGN KEY ("redeemCodeId") REFERENCES "public"."redeem_codes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redeem_code_claims" ADD CONSTRAINT "redeem_code_claims_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "redeem_code_claims" ("redeemCodeId", "userId", "createdAt")
SELECT "id", "usedBy", COALESCE("usedAt", "createdAt")
FROM "redeem_codes"
WHERE "usedBy" IS NOT NULL
ON CONFLICT ("redeemCodeId", "userId") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "site_settings"
	ADD COLUMN IF NOT EXISTS "chatAnnouncementEnabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "site_settings"
	ADD COLUMN IF NOT EXISTS "chatAnnouncementTitle" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "site_settings"
	ADD COLUMN IF NOT EXISTS "chatAnnouncementMessage" text DEFAULT '' NOT NULL;
