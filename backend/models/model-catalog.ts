import "server-only";

import { db } from "@backend/db/queries";
import { modelCatalog, modelCatalogRefreshLog } from "@backend/db/schema";
import { and, eq, sql } from "drizzle-orm";

const SUMOPOD_BASE_URL = "https://ai.sumopod.com/v1";
const FREE_MODEL_HINT = "minimax-m2.7-highspeed";

const CAPABILITY_OVERRIDES: Record<string, string[]> = {
	"gpt-5.3": ["text"],
	"gpt-5.3-codex": ["text", "code"],
};

export function parsePrice(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const cleaned = value.replace(/[^0-9.]/g, "");
		const num = Number(cleaned);
		return Number.isFinite(num) ? num : null;
	}
	return null;
}

export function normalizeCapabilities(raw: unknown, modelId: string): string[] {
	const normalizedId = modelId.toLowerCase();
	const override = CAPABILITY_OVERRIDES[normalizedId];
	if (override?.length) return override;

	const result = new Set<string>();
	if (Array.isArray(raw)) {
		for (const item of raw) {
			if (typeof item === "string" && item.trim()) {
				result.add(item.trim().toLowerCase());
			}
		}
	}

	const hasImageGeneration =
		result.has("image") ||
		result.has("image_generation") ||
		result.has("image-gen");
	if (hasImageGeneration) {
		result.add("image");
		result.add("logo");
	}

	if (result.size === 0) {
		result.add("text");
	}

	return Array.from(result);
}

export function getPriceFromModel(rawModel: Record<string, unknown>) {
	const pricing =
		(rawModel.pricing as Record<string, unknown> | undefined) ||
		(rawModel.price as Record<string, unknown> | undefined) ||
		(rawModel.cost as Record<string, unknown> | undefined) ||
		{};

	const priceIn =
		parsePrice(pricing.prompt) ??
		parsePrice(pricing.input) ??
		parsePrice(pricing.in) ??
		parsePrice(rawModel.priceIn) ??
		parsePrice(rawModel.price_input);

	const priceOut =
		parsePrice(pricing.completion) ??
		parsePrice(pricing.output) ??
		parsePrice(pricing.out) ??
		parsePrice(rawModel.priceOut) ??
		parsePrice(rawModel.price_output);

	return { priceIn, priceOut };
}

function isFreeModel(modelId: string) {
	return modelId.toLowerCase().includes(FREE_MODEL_HINT);
}

export type ModelCatalogFilter = {
	capability?: string;
	provider?: string;
	free?: boolean;
	limit?: number;
	offset?: number;
};

export async function listModelCatalog(filter: ModelCatalogFilter = {}) {
	const conditions = [];

	// Default: only show active models unless explicitly overridden
	conditions.push(eq(modelCatalog.status, "active"));

	if (filter.provider) {
		conditions.push(eq(modelCatalog.provider, filter.provider));
	}

	if (filter.free !== undefined) {
		conditions.push(eq(modelCatalog.isFree, filter.free));
	}

	if (filter.capability) {
		conditions.push(
			sql`${modelCatalog.capabilities}::jsonb ? ${filter.capability}`,
		);
	}

	const baseQuery = db.select().from(modelCatalog);
	const whereClause = conditions.length ? and(...conditions) : undefined;

	const result = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
		.orderBy(modelCatalog.name)
		.limit(filter.limit ?? 200)
		.offset(filter.offset ?? 0);

	return result;
}

export async function getModelCatalogById(modelId: string) {
	const [result] = await db
		.select()
		.from(modelCatalog)
		.where(eq(modelCatalog.modelId, modelId))
		.limit(1);
	return result ?? null;
}

export async function refreshModelCatalog() {
	const apiKey = process.env.SUMOPOD_API_KEY || "sk-xH8PVl2onLyLIs-6esUn9g";
	if (!apiKey) {
		await db.insert(modelCatalogRefreshLog).values({
			status: "error",
			message: "Missing SUMOPOD_API_KEY",
			count: 0,
		});
		throw new Error("Missing SUMOPOD_API_KEY");
	}

	// Import enrichModel lazily to avoid circular deps
	const { enrichModel } = await import("@backend/models/model-metadata");

	const response = await fetch(`${SUMOPOD_BASE_URL}/models`, {
		redirect: "follow",
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	const payload = await response.json().catch(() => null);
	if (!response.ok || !payload) {
		const errorText = JSON.stringify(payload ?? { error: "Invalid response" });
		await db.insert(modelCatalogRefreshLog).values({
			status: "error",
			message: errorText.slice(0, 500),
			count: 0,
		});
		throw new Error("Failed to fetch SumoPod models");
	}

	const models = Array.isArray(payload)
		? payload
		: Array.isArray(payload.data)
			? payload.data
			: [];

	let count = 0;
	for (const raw of models) {
		if (!raw || typeof raw !== "object") continue;
		const modelRecord = raw as Record<string, unknown>;
		const modelId = String(modelRecord.id || modelRecord.model || "").trim();
		if (!modelId) continue;

		// Get data from API response first
		const apiName = String(modelRecord.name || modelId);
		const apiProvider = String(
			modelRecord.provider ||
				modelRecord.owner ||
				modelRecord.owned_by ||
				"unknown",
		);
		const apiContext =
			modelRecord.context_length ||
			modelRecord.context ||
			modelRecord.max_context;
		const apiContextText = apiContext ? String(apiContext) : null;

		const { priceIn: apiPriceIn, priceOut: apiPriceOut } =
			getPriceFromModel(modelRecord);
		const apiCapabilities = normalizeCapabilities(
			modelRecord.capabilities || modelRecord.modalities,
			modelId,
		);

		// Enrich with static metadata when API doesn't provide data
		const meta = enrichModel(modelId, apiProvider);

		const name = meta.displayName || apiName;
		const provider = meta.provider || apiProvider;
		const contextText =
			apiContextText || (meta.context ? String(meta.context) : null);
		const priceIn = apiPriceIn ?? (meta.priceIn ? Number(meta.priceIn) : null);
		const priceOut =
			apiPriceOut ?? (meta.priceOut ? Number(meta.priceOut) : null);
		const capabilities =
			apiCapabilities.length > 1 || apiCapabilities[0] !== "text"
				? apiCapabilities
				: meta.capabilities;

		// Models with pricing are active, others use metadata to decide
		const status = priceIn !== null || priceOut !== null ? "active" : "active";

		const priceInStr = priceIn !== null ? String(priceIn) : null;
		const priceOutStr = priceOut !== null ? String(priceOut) : null;

		await db
			.insert(modelCatalog)
			.values({
				modelId,
				name,
				provider,
				context: contextText,
				priceIn: priceInStr,
				priceOut: priceOutStr,
				isFree: isFreeModel(modelId),
				capabilities,
				status,
				raw: modelRecord,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: modelCatalog.modelId,
				set: {
					name,
					provider,
					context: contextText,
					priceIn: priceInStr,
					priceOut: priceOutStr,
					isFree: isFreeModel(modelId),
					capabilities,
					status,
					raw: modelRecord,
					updatedAt: new Date(),
				},
			});
		count += 1;
	}

	await db.insert(modelCatalogRefreshLog).values({
		status: "success",
		message: "OK",
		count,
	});

	return { count };
}
