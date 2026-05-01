import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./queries";
import { siteSettings, userApiKeys, userSettings } from "./schema";

// ============================================================
// User Settings (Personalization)
// ============================================================

export async function getUserSettings(userId: string) {
	try {
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

export async function getSiteSettings() {
	try {
		const result = await db
			.select()
			.from(siteSettings)
			.where(eq(siteSettings.key, "global"));

		return result[0] || null;
	} catch (error) {
		console.error("Database Error (getSiteSettings):", error);
		return null;
	}
}

export async function upsertSiteSettings(data: {
	maintenanceEnabled?: boolean;
	maintenanceTemplate?: string;
	maintenanceTitle?: string;
	maintenanceMessage?: string;
	updatedBy?: string | null;
}) {
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
		return await db
			.select()
			.from(userApiKeys)
			.where(eq(userApiKeys.userId, userId));
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
