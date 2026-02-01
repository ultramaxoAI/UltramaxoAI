-- Add missing username column to user table
-- Run in Neon SQL Editor

BEGIN;

-- Check current user table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user';

-- Add username column if missing
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT 'user';

-- Verify after adding
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user'
ORDER BY ordinal_position;

COMMIT;
