-- Clean up ALL users and start fresh
-- Run this in Neon SQL Editor: https://console.neon.tech

BEGIN;

-- Drop all foreign key data first
TRUNCATE TABLE "Chat" CASCADE;
TRUNCATE TABLE "Document" CASCADE;
TRUNCATE TABLE "Suggestion" CASCADE;
TRUNCATE TABLE "Message" CASCADE;
TRUNCATE TABLE "Vote" CASCADE;
TRUNCATE TABLE "Session" CASCADE;
TRUNCATE TABLE "Account" CASCADE;
TRUNCATE TABLE "VerificationToken" CASCADE;

-- Clean purchase_requests if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
    TRUNCATE TABLE "purchase_requests" CASCADE;
  END IF;
END $$;

-- Clean redeem_codes if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'redeem_codes') THEN
    TRUNCATE TABLE "redeem_codes" CASCADE;
  END IF;
END $$;

-- Clean password_reset_token if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_token') THEN
    TRUNCATE TABLE "password_reset_token" CASCADE;
  END IF;
END $$;

-- Finally delete ALL users
TRUNCATE TABLE "user" CASCADE;

COMMIT;

SELECT 'All users deleted. Database is clean. Register new account now.' as status;
