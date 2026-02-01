-- Fix foreign key constraint Chat -> user
-- Run in Neon SQL Editor

BEGIN;

-- Check current foreign key
SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to
FROM pg_constraint
WHERE conname = 'Chat_userId_User_id_fk';

-- Drop old constraint pointing to "User"
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";

-- Add new constraint pointing to "user" (lowercase)
ALTER TABLE "Chat" 
ADD CONSTRAINT "Chat_userId_user_id_fk" 
FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;

-- Verify fix
SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to
FROM pg_constraint
WHERE conname = 'Chat_userId_user_id_fk';

COMMIT;
