import { listModelCatalog } from "@backend/models/model-catalog";
import { enrichModel, MODEL_METADATA } from "@backend/models/model-metadata";
import { type NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const FREE_MODEL_HINT = "gpt-5.3";

/**
 * Build the full model list from static metadata.
 * Instant — no DB or network call required.
 */
function getStaticModelList() {
	return Object.entries(MODEL_METADATA).map(([modelId, meta]) => ({
		modelId,
		name: meta.displayName,
		provider: meta.provider,
		context: meta.context ? String(meta.context) : null,
		priceIn: meta.priceIn !== null ? String(meta.priceIn) : null,
		priceOut: meta.priceOut !== null ? String(meta.priceOut) : null,
		isFree: meta.isFree || modelId.toLowerCase().includes(FREE_MODEL_HINT),
		capabilities: meta.capabilities,
		status: "active",
	}));
}

// In-memory cache enriched from DB (populated lazily in background)
let dbEnrichedModels: any[] | null = null;
let dbFetchInFlight = false;

function refreshFromDB() {
	if (dbFetchInFlight) return;
	dbFetchInFlight = true;
	listModelCatalog({})
		.then((dbModels) => {
			if (dbModels.length > 0) {
				dbEnrichedModels = dbModels.map((m: any) => {
					const meta = enrichModel(m.modelId, m.provider);
					return {
						...m,
						name: m.name || meta.displayName,
						provider: meta.provider || m.provider,
						capabilities:
							m.capabilities?.length > 0 && m.capabilities[0] !== "text"
								? m.capabilities
								: meta.capabilities,
						context: m.context || meta.context,
						priceIn: m.priceIn || meta.priceIn,
						priceOut: m.priceOut || meta.priceOut,
					};
				});
			}
		})
		.catch(() => {})
		.finally(() => {
			dbFetchInFlight = false;
		});
}

function applyFilters(
	models: any[],
	filter: {
		capability?: string;
		provider?: string;
		free?: boolean;
		limit?: number;
		offset?: number;
	},
) {
	let filtered = models;
	if (filter.provider) {
		filtered = filtered.filter(
			(m) => m.provider.toLowerCase() === filter.provider?.toLowerCase(),
		);
	}
	if (filter.capability) {
		filtered = filtered.filter((m) =>
			m.capabilities.includes(filter.capability!),
		);
	}
	if (filter.free !== undefined) {
		filtered = filtered.filter((m) => m.isFree === filter.free);
	}
	if (filter.limit) {
		filtered = filtered.slice(
			filter.offset || 0,
			(filter.offset || 0) + filter.limit,
		);
	}
	return filtered;
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const filter = {
		capability: searchParams.get("capability") ?? undefined,
		provider: searchParams.get("provider") ?? undefined,
		free: searchParams.has("free")
			? searchParams.get("free") === "true"
			: undefined,
		limit: searchParams.has("limit")
			? Number(searchParams.get("limit"))
			: undefined,
		offset: searchParams.has("offset")
			? Number(searchParams.get("offset"))
			: undefined,
	};

	// Kick off a DB refresh in the background (non-blocking)
	refreshFromDB();

	// Serve immediately: use DB-enriched cache if available, otherwise static
	const source = dbEnrichedModels || getStaticModelList();
	const models = applyFilters(source, filter);

	return NextResponse.json({ data: models }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
