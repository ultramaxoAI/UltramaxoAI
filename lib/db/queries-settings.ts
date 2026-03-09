import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "./queries";
import { siteSettings, userApiKeys, userSettings } from "./schema";

// ============================================================
// Auto-create tables if missing
// ============================================================

async function ensureUserSettingsTable() {
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "user_settings" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
				"displayName" text,
				"customInstructions" text,
				"language" varchar(10) DEFAULT 'en',
				"createdAt" timestamp NOT NULL DEFAULT now(),
				"updatedAt" timestamp NOT NULL DEFAULT now()
			)
		`);
	} catch (error) {
		console.warn("Could not ensure user_settings table:", error);
	}
}

async function ensureUserApiKeysTable() {
	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "user_api_keys" (
				"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
				"provider" varchar(50) NOT NULL,
				"keysEncrypted" text,
				"isEnabled" boolean NOT NULL DEFAULT false,
				"customModels" json DEFAULT '[]',
				"createdAt" timestamp NOT NULL DEFAULT now(),
				"updatedAt" timestamp NOT NULL DEFAULT now()
			)
		`);
	} catch (error) {
		console.warn("Could not ensure user_api_keys table:", error);
	}
}

// ============================================================
// User Settings (Personalization)
// ============================================================

export async function getUserSettings(userId: string) {
	try {
		await ensureUserSettingsTable();
		const result = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId));
		return result[0] || null;
	} catch (error) {
		console.error("Database Error (getUserSettings):", error);
		return null;
	}
}

export async function upsertUserSettings(
	userId: string,
	data: {
		displayName?: string | null;
		customInstructions?: string | null;
		language?: string;
	},
) {
	const existing = await getUserSettings(userId);
	if (existing) {
		return db
			.update(userSettings)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(userSettings.userId, userId))
			.returning();
	}
	return db
		.insert(userSettings)
		.values({ userId, ...data })
		.returning();
}

// ============================================================
// Site Settings (Global)
// ============================================================

async function ensureSiteSettingsTable() {
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "site_settings" (
			"key" varchar(50) PRIMARY KEY DEFAULT 'global',
			"maintenanceEnabled" boolean NOT NULL DEFAULT false,
			"maintenanceTemplate" varchar(30) NOT NULL DEFAULT 'midnight',
			"maintenanceTitle" text NOT NULL DEFAULT 'We''ll be right back.',
			"maintenanceMessage" text NOT NULL DEFAULT 'Lagi ada update kecil. Sebentar lagi balik.',
			"updatedBy" uuid,
			"createdAt" timestamp NOT NULL DEFAULT now(),
			"updatedAt" timestamp NOT NULL DEFAULT now()
		)
	`);

	// Add column if missing (existing tables)
	await db.execute(sql`
		ALTER TABLE "site_settings"
		ADD COLUMN IF NOT EXISTS "maintenanceTemplate" varchar(30) NOT NULL DEFAULT 'midnight'
	`);

	await db.execute(sql`
		INSERT INTO "site_settings" ("key")
		VALUES ('global')
		ON CONFLICT ("key") DO NOTHING
	`);
}

export async function getSiteSettings() {
	await ensureSiteSettingsTable();

	const result = await db
		.select()
		.from(siteSettings)
		.where(eq(siteSettings.key, "global"));

	return result[0] || null;
}

export async function upsertSiteSettings(data: {
	maintenanceEnabled?: boolean;
	maintenanceTemplate?: string;
	maintenanceTitle?: string;
	maintenanceMessage?: string;
	updatedBy?: string | null;
}) {
	await ensureSiteSettingsTable();

	const existing = await getSiteSettings();
	const normalizedData = {
		...data,
		updatedAt: new Date(),
	};

	if (existing) {
		return db
			.update(siteSettings)
			.set(normalizedData)
			.where(eq(siteSettings.key, "global"))
			.returning();
	}

	return db
		.insert(siteSettings)
		.values({ key: "global", ...normalizedData })
		.returning();
}

// ============================================================
// User API Keys (Custom AI)
// ============================================================

export async function getUserApiKeys(userId: string) {
	try {
		await ensureUserApiKeysTable();
		return await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
	} catch (error) {
		console.error("Database Error (getUserApiKeys):", error);
		return [];
	}
}

export async function getUserApiKeyByProvider(
	userId: string,
	provider: string,
) {
	try {
		const result = await db
			.select()
			.from(userApiKeys)
			.where(
				and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)),
			);
		return result[0] || null;
	} catch (error) {
		console.error("Database Error (getUserApiKeyByProvider):", error);
		return null;
	}
}

export async function upsertUserApiKey(
	userId: string,
	provider: string,
	data: {
		keysEncrypted?: string | null;
		isEnabled?: boolean;
		customModels?: string[];
	},
) {
	const existing = await getUserApiKeyByProvider(userId, provider);
	if (existing) {
		return db
			.update(userApiKeys)
			.set({ ...data, updatedAt: new Date() })
			.where(
				and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)),
			)
			.returning();
	}
	return db
		.insert(userApiKeys)
		.values({
			userId,
			provider,
			keysEncrypted: data.keysEncrypted || null,
			isEnabled: data.isEnabled ?? false,
			customModels: data.customModels || [],
		})
		.returning();
}

export async function deleteUserApiKey(userId: string, provider: string) {
	return db
		.delete(userApiKeys)
		.where(
			and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)),
		);
}

export async function getEnabledUserApiKey(userId: string) {
	try {
		const result = await db
			.select()
			.from(userApiKeys)
			.where(
				and(eq(userApiKeys.userId, userId), eq(userApiKeys.isEnabled, true)),
			);
		return result[0] || null;
	} catch (error) {
		console.error("Database Error (getEnabledUserApiKey):", error);
		return null;
	}
}
