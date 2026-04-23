CREATE TABLE IF NOT EXISTS "page_visit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"ipHash" text NOT NULL,
	"visitedAt" timestamp DEFAULT now() NOT NULL
);
