-- Fix admin user ID to proper UUID format
-- Run this in Neon SQL Editor

BEGIN;

-- Generate a proper UUID for admin (consistent UUID based on username)
DO $$
DECLARE
  old_admin_id text := 'admin-putra-id';
  new_admin_id uuid := '00000000-0000-0000-0000-000000000001'; -- Admin UUID
BEGIN
  -- Check if old admin exists
  IF EXISTS (SELECT 1 FROM "user" WHERE id::text = old_admin_id) THEN
    
    -- Update Chat references
    UPDATE "Chat" 
    SET "userId" = new_admin_id 
    WHERE "userId"::text = old_admin_id;
    
    -- Update Document references
    UPDATE "Document" 
    SET "userId" = new_admin_id 
    WHERE "userId"::text = old_admin_id;
    
    -- Update Suggestion references  
    UPDATE "Suggestion" 
    SET "userId" = new_admin_id 
    WHERE "userId"::text = old_admin_id;
    
    -- Update purchase_requests if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
      UPDATE "purchase_requests" 
      SET "userId" = new_admin_id 
      WHERE "userId"::text = old_admin_id;
    END IF;
    
    -- Update redeem_codes if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'redeem_codes') THEN
      UPDATE "redeem_codes" 
      SET "usedBy" = new_admin_id 
      WHERE "usedBy"::text = old_admin_id;
    END IF;
    
    -- Finally, update the user ID itself
    UPDATE "user" 
    SET id = new_admin_id 
    WHERE id::text = old_admin_id;
    
    RAISE NOTICE 'Admin user ID updated from % to %', old_admin_id, new_admin_id;
  ELSE
    RAISE NOTICE 'Admin user with ID % not found', old_admin_id;
  END IF;
END $$;

COMMIT;
