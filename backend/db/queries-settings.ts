import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "./queries";
import { siteSettings, userApiKeys, userSettings } from "./schema";

export const MAINTENANCE_SCOPES = ["chat", "api"] as const;
export type MaintenanceScope = (typeof MAINTENANCE_SCOPES)[number];

export type MaintenanceSettingsRecord = {
	key: string;
	maintenanceEnabled: boolean;
	maintenanceTemplate: string;
	maintenanceTitle: string;
	maintenanceMessage: string;
	updatedBy?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};

export const DEFAULT_MAINTENANCE_SETTINGS: Omit<
	MaintenanceSettingsRecord,
	"key"
> = {
	maintenanceEnabled: false,
	maintenanceTemplate: "minimal",
	maintenanceTitle: "We will be right back.",
	maintenanceMessage: "Lagi ada update kecil. Sebentar lagi balik.",
	updatedBy: null,
};

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

export async function getSiteSettings(key = "global") {
	try {
		const result = await db
			.select()
			.from(siteSettings)
			.where(eq(siteSettings.key, key));

		return result[0] || null;
	} catch (error) {
		console.error("Database Error (getSiteSettings):", error);
		return null;
	}
}

export async function listSiteSettings(keys?: string[]) {
	try {
		if (keys?.length) {
			return await db
				.select()
				.from(siteSettings)
				.where(inArray(siteSettings.key, keys));
		}
		return await db.select().from(siteSettings);
	} catch (error) {
		console.error("Database Error (listSiteSettings):", error);
		return [];
	}
}

export async function getMaintenanceSettings(scope: MaintenanceScope) {
	const [scopedSettings, globalSettings] = await Promise.all([
		getSiteSettings(scope),
		getSiteSettings("global"),
	]);

	return {
		key: scope,
		...DEFAULT_MAINTENANCE_SETTINGS,
		...(globalSettings
			? {
					maintenanceTemplate: globalSettings.maintenanceTemplate,
					maintenanceTitle: globalSettings.maintenanceTitle,
					maintenanceMessage: globalSettings.maintenanceMessage,
				}
			: {}),
		...(scopedSettings ?? {}),
	} satisfies MaintenanceSettingsRecord;
}

export async function listMaintenanceSettings() {
	const settingsRows = await listSiteSettings([
		...MAINTENANCE_SCOPES,
		"global",
	]);
	const rowsByKey = new Map(settingsRows.map((row) => [row.key, row]));
	const globalSettings = rowsByKey.get("global");

	return Object.fromEntries(
		MAINTENANCE_SCOPES.map((scope) => {
			const scopedSettings = rowsByKey.get(scope);
			return [
				scope,
				{
					key: scope,
					...DEFAULT_MAINTENANCE_SETTINGS,
					...(globalSettings
						? {
								maintenanceTemplate: globalSettings.maintenanceTemplate,
								maintenanceTitle: globalSettings.maintenanceTitle,
								maintenanceMessage: globalSettings.maintenanceMessage,
							}
						: {}),
					...(scopedSettings ?? {}),
				} satisfies MaintenanceSettingsRecord,
			];
		}),
	) as Record<MaintenanceScope, MaintenanceSettingsRecord>;
}

export async function upsertSiteSettings(
	key: string,
	data: {
		maintenanceEnabled?: boolean;
		maintenanceTemplate?: string;
		maintenanceTitle?: string;
		maintenanceMessage?: string;
		updatedBy?: string | null;
	},
) {
	const existing = await getSiteSettings(key);
	const normalizedData = {
		...data,
		updatedAt: new Date(),
	};

	if (existing) {
		return db
			.update(siteSettings)
			.set(normalizedData)
			.where(eq(siteSettings.key, key))
			.returning();
	}

	return db
		.insert(siteSettings)
		.values({ key, ...normalizedData })
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
