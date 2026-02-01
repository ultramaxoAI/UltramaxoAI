-- Safe migration: Migrate User table to new schema with all required columns
-- Run this in Neon SQL Editor: https://console.neon.tech
-- Run each section separately if needed

-- 1. Add new columns to existing User table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name') THEN
    ALTER TABLE "User" ADD COLUMN "name" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emailVerified') THEN
    ALTER TABLE "User" ADD COLUMN "emailVerified" timestamp;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'image') THEN
    ALTER TABLE "User" ADD COLUMN "image" text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') THEN
    ALTER TABLE "User" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isPro') THEN
    ALTER TABLE "User" ADD COLUMN "isPro" boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'limitCount') THEN
    ALTER TABLE "User" ADD COLUMN "limitCount" integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'proExpiresAt') THEN
    ALTER TABLE "User" ADD COLUMN "proExpiresAt" timestamp;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'createdAt') THEN
    ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'updatedAt') THEN
    ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;
  END IF;
END $$;

-- 2. Rename User to user (if not already renamed)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'User') THEN
    ALTER TABLE "User" RENAME TO "user";
  END IF;
END $$;

-- 4. Create purchase_requests table
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

-- 5. Create password_reset_token table
CREATE TABLE IF NOT EXISTS "password_reset_token" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- 6. Create redeem_codes table
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

-- 7. Update foreign key constraints
DO $$ 
BEGIN
  -- Drop old constraints if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Chat_userId_User_id_fk') THEN
    ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_User_id_fk";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_userId_User_id_fk') THEN
    ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_User_id_fk";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Suggestion_userId_User_id_fk') THEN
    ALTER TABLE "Suggestion" DROP CONSTRAINT "Suggestion_userId_User_id_fk";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_chatId_Chat_id_fk') THEN
    ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_Chat_id_fk";
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vote_messageId_Message_id_fk') THEN
    ALTER TABLE "Vote" DROP CONSTRAINT "Vote_messageId_Message_id_fk";
  END IF;
  
  -- Add new constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Chat_userId_user_id_fk') THEN
    ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Document_userId_user_id_fk') THEN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Suggestion_userId_user_id_fk') THEN
    ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Message_chatId_Chat_id_fk') THEN
    ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vote_messageId_Message_id_fk') THEN
    ALTER TABLE "Vote" ADD CONSTRAINT "Vote_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- 8. Drop playing_with_neon table if exists (test table)
DROP TABLE IF EXISTS "playing_with_neon" CASCADE;
