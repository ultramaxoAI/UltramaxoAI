CREATE TABLE IF NOT EXISTS "site_settings" (
	"key" varchar(50) PRIMARY KEY DEFAULT 'global' NOT NULL,
	"maintenanceEnabled" boolean DEFAULT false NOT NULL,
	"maintenanceTemplate" varchar(30) DEFAULT 'midnight' NOT NULL,
	"maintenanceTitle" text DEFAULT 'We''ll be right back.' NOT NULL,
	"maintenanceMessage" text DEFAULT 'Lagi ada update kecil. Sebentar lagi balik.' NOT NULL,
	"updatedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "onboardingReason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "freeIdeModeUsedAt" timestamp;