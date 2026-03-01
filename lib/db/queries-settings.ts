import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "./queries";
import { userApiKeys, userSettings } from "./schema";

// ============================================================
// User Settings (Personalization)
// ============================================================

export async function getUserSettings(userId: string) {
	const result = await db
		.select()
		.from(userSettings)
		.where(eq(userSettings.userId, userId));
	return result[0] || null;
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
// User API Keys (Custom AI)
// ============================================================

export async function getUserApiKeys(userId: string) {
	return db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
}

export async function getUserApiKeyByProvider(
	userId: string,
	provider: string,
) {
	const result = await db
		.select()
		.from(userApiKeys)
		.where(
			and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)),
		);
	return result[0] || null;
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
	const result = await db
		.select()
		.from(userApiKeys)
		.where(
			and(eq(userApiKeys.userId, userId), eq(userApiKeys.isEnabled, true)),
		);
	return result[0] || null;
}
