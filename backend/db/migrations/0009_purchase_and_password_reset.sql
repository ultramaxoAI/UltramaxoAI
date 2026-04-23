CREATE TABLE IF NOT EXISTS "purchase_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "username" text,
  "email" text,
  "planId" text NOT NULL,
  "months" integer NOT NULL DEFAULT 1,
  "price" integer NOT NULL DEFAULT 0,
  "method" text NOT NULL DEFAULT 'manual',
  "status" text NOT NULL DEFAULT 'pending',
  "note" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "password_reset_token" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
