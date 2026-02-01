-- Set admin role for your user
-- Run in Neon SQL Editor

BEGIN;

-- Check current users and their roles
SELECT id, email, username, role FROM "user";

-- Update user to admin (replace email with your actual email)
UPDATE "user" 
SET role = 'admin'
WHERE email = 'admin@nexus.ai';

-- Verify admin role
SELECT id, email, username, role FROM "user" WHERE role = 'admin';

COMMIT;
