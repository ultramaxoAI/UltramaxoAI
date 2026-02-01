-- Delete users without proper username and register fresh
-- Run in Neon SQL Editor

BEGIN;

-- Check current users
SELECT id, email, username FROM "user";

-- Delete ALL users (we'll register fresh)
TRUNCATE TABLE "Chat" CASCADE;
TRUNCATE TABLE "user" CASCADE;

-- Verify clean
SELECT COUNT(*) as user_count FROM "user";
SELECT COUNT(*) as chat_count FROM "Chat";

COMMIT;
