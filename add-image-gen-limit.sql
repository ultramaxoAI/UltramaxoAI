-- Migration: Add daily image generation limit + token usage tracking
-- Run this against your Postgres database

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "imageGenCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "imageGenCountResetAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "tokenUsage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tokenUsageResetAt" TIMESTAMP;
