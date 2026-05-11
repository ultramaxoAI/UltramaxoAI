export type PublicModel = {
	modelId: string;
	name: string;
	provider: string;
	context: string;
	priceIn: string | null;
	priceOut: string | null;
	isFree: boolean;
	capabilities: string[];
	status: "active";
};

export const PUBLIC_MODELS: PublicModel[] = [
	{
		modelId: "ultramaxo/ultra-agent",
		name: "UltraAgent",
		provider: "Ultramaxo",
		context: "131000",
		priceIn: "0",
		priceOut: "0",
		isFree: true,
		capabilities: ["text", "tools"],
		status: "active",
	},
	{
		modelId: "ultramaxo/ultra-agent-pro",
		name: "UltraAgent Pro",
		provider: "Ultramaxo",
		context: "131000",
		priceIn: "0.5",
		priceOut: "2",
		isFree: false,
		capabilities: ["text", "tools", "code"],
		status: "active",
	},
	{
		modelId: "openai/gpt-5.4-mini",
		name: "GPT-5.4 Mini",
		provider: "OpenAI",
		context: "400000",
		priceIn: "0.75",
		priceOut: "4.5",
		isFree: false,
		capabilities: ["text", "vision", "tools", "code"],
		status: "active",
	},
];

export const PUBLIC_MODEL_IDS = new Set(PUBLIC_MODELS.map((model) => model.modelId));

export function getPublicModelById(modelId: string) {
	return PUBLIC_MODELS.find((model) => model.modelId === modelId) ?? null;
}

export function listPublicModels(filter: {
	capability?: string;
	provider?: string;
	free?: boolean;
	limit?: number;
	offset?: number;
} = {}) {
	let models = PUBLIC_MODELS;

	if (filter.provider) {
		models = models.filter(
			(model) => model.provider.toLowerCase() === filter.provider?.toLowerCase(),
		);
	}

	if (filter.capability) {
		models = models.filter((model) => model.capabilities.includes(filter.capability!));
	}

	if (filter.free !== undefined) {
		models = models.filter((model) => model.isFree === filter.free);
	}

	const offset = filter.offset ?? 0;
	const limit = filter.limit ?? models.length;
	return models.slice(offset, offset + limit);
}
