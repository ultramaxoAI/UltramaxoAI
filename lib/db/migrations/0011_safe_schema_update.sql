-- Safe migration: Rename User to user and add missing columns
-- Run this in Supabase SQL Editor

-- 1. Rename User table to user (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'User') THEN
    ALTER TABLE "User" RENAME TO "user";
  END IF;
END $$;

-- 2. Add missing columns to user table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'isPro') THEN
    ALTER TABLE "user" ADD COLUMN "isPro" boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'limitCount') THEN
    ALTER TABLE "user" ADD COLUMN "limitCount" integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'proExpiresAt') THEN
    ALTER TABLE "user" ADD COLUMN "proExpiresAt" timestamp;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'role') THEN
    ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- 3. Create purchase_requests table if not exists
CREATE TABLE IF NOT EXISTS "purchase_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "username" text,
  "email" text,
  "planId" text NOT NULL,
  "months" integer DEFAULT 1 NOT NULL,
  "price" integer DEFAULT 0 NOT NULL,
  "method" text DEFAULT 'manual' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "note" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- 4. Create password_reset_token table if not exists
CREATE TABLE IF NOT EXISTS "password_reset_token" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- 5. Create redeem_codes table if not exists
CREATE TABLE IF NOT EXISTS "redeem_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) UNIQUE NOT NULL,
  "type" varchar NOT NULL,
  "value" integer DEFAULT 0,
  "durationMonths" integer DEFAULT 0,
  "isUsed" boolean DEFAULT false NOT NULL,
  "usedBy" uuid REFERENCES "user"("id") ON DELETE SET NULL,
  "usedAt" timestamp,
  "expiresAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- 6. Update foreign key constraints (drop and recreate)
DO $$ 
BEGIN
  -- Drop old constraints if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Chat_userId_User_id_fk') THEN
    ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_User_id_fk";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_userId_User_id_fk') THEN
    ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_id_fk";
  END IF;
  
  -- Add new constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Chat_userId_user_id_fk') THEN
    ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_userId_user_id_fk') THEN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
  END IF;
END $$;
