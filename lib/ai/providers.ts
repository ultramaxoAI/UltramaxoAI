import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// ============================================================
// Default API Keys Setup
// ============================================================
const maiaApiKey = (process.env.OPENROUTER_API_KEY_1 || "").trim();

// ============================================================
// Model IDs
// ============================================================
const DEFAULT_MODEL = "maia/gemini-2.5-flash-lite";
const PRO_MODEL = "maia/gemini-2.5-flash-lite";

export interface CustomKeyConfig {
	provider: string;
	apiKey: string;
}

// ============================================================
// Provider Clients
// ============================================================

function getMaiaRouterModel(modelId: string, customKey?: string) {
	const key = customKey || maiaApiKey;
	if (!key) {
		throw new Error("No MAIA Router API key configured.");
	}
	const client = createOpenAI({
		baseURL: "https://api.maiarouter.ai/v1",
		apiKey: key,
		headers: {
			"HTTP-Referer": "https://ultramaxo.com",
			"X-Title": "Ultramaxo AI",
		},
	});
	return client.chat(modelId);
}

function getOpenRouterModel(modelId: string, customKey?: string) {
	if (!customKey) throw new Error("No OpenRouter API key provided.");
	const client = createOpenAI({
		baseURL: "https://openrouter.ai/api/v1",
		apiKey: customKey,
		fetch: async (url, options) => {
			const headers = new Headers(options?.headers);
			headers.set("HTTP-Referer", "https://ultramaxo.com");
			headers.set("X-Title", "Ultramaxo AI");

			return fetch(url, {
				...options,
				headers,
			});
		},
	});
	return client.chat(modelId);
}

function getGroqModel(modelId: string, customKey?: string) {
	if (!customKey) throw new Error("No Groq API key provided.");
	const client = createOpenAI({
		baseURL: "https://api.groq.com/openai/v1",
		apiKey: customKey,
	});
	return client.chat(modelId);
}

function getOpenAIModel(modelId: string, customKey?: string) {
	if (!customKey) throw new Error("No OpenAI API key provided.");
	const client = createOpenAI({
		baseURL: "https://api.openai.com/v1",
		apiKey: customKey,
	});
	return client.chat(modelId);
}

function getAnthropicModel(modelId: string, customKey?: string) {
	if (!customKey) throw new Error("No Anthropic API key provided.");
	const client = createAnthropic({
		apiKey: customKey,
	});
	return client(modelId);
}

function getGeminiModel(modelId: string, customKey?: string) {
	if (!customKey) throw new Error("No Gemini API key provided.");
	const client = createGoogleGenerativeAI({
		apiKey: customKey,
	});
	return client(modelId);
}

// ============================================================
// getLanguageModel - main routing function
// ============================================================
export const getLanguageModel = (
	modelId: string,
	customConfig?: CustomKeyConfig | null,
) => {
	const normalized = modelId.toLowerCase();
	console.log("-------------------------------------------");
	console.log(`[AI Provider] Model Requested: ${modelId}`);

	// If user provided a custom API key config for a specific provider
	if (customConfig && !normalized.includes("ultramaxo/")) {
		console.log(`[AI Provider] Using CUSTOM Key for: ${customConfig.provider}`);

		// Extract actual model name if it has a provider prefix
		const actualModelId = modelId.includes("/")
			? modelId.split("/").slice(1).join("/")
			: modelId;

		try {
			switch (customConfig.provider) {
				case "gemini":
					return getGeminiModel(actualModelId, customConfig.apiKey);
				case "openrouter":
					return getOpenRouterModel(actualModelId, customConfig.apiKey);
				case "groq":
					return getGroqModel(actualModelId, customConfig.apiKey);
				case "openai":
					return getOpenAIModel(actualModelId, customConfig.apiKey);
				case "anthropic":
					return getAnthropicModel(actualModelId, customConfig.apiKey);
				case "maia":
					return getMaiaRouterModel(actualModelId, customConfig.apiKey);
				default:
					console.log(
						`[AI Provider] Unknown custom provider: ${customConfig.provider}, falling back to default`,
					);
			}
		} catch (e) {
			console.error("[AI Provider] Custom key failed, falling back.", e);
		}
	}

	// Default fallback using environment variables
	if (
		normalized.includes("ultra-agent") ||
		normalized.includes("pro") ||
		normalized.includes("ultramaxo/")
	) {
		console.log("[AI Provider] -> UltraAgent:", modelId);
		// Pass the exact model id or a fallback mapping
		const targetModel = normalized.includes("ultra-agent-pro")
			? PRO_MODEL
			: DEFAULT_MODEL;
		return getMaiaRouterModel(targetModel);
	}

	if (normalized.startsWith("maia/") || normalized.startsWith("xai/")) {
		console.log("[AI Provider] -> Passthrough (Default Key):", modelId);
		return getMaiaRouterModel(modelId);
	}

	console.log("[AI Provider] -> Default Fallback:", DEFAULT_MODEL);
	return getMaiaRouterModel(DEFAULT_MODEL);
};

// ============================================================
// Internal Utility Models (using MAIA Default)
// ============================================================
export function getTitleModel() {
	return getMaiaRouterModel(DEFAULT_MODEL);
}

export function getArtifactModel() {
	return getMaiaRouterModel(DEFAULT_MODEL);
}

export function getImageModel() {
	return getMaiaRouterModel(DEFAULT_MODEL);
}
