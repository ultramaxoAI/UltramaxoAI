/**
 * Static metadata for models served via SwiftRouter (Starter Plan).
 * SwiftRouter free-tier API only returns { id, object, created, owned_by }.
 * This file enriches each model with real pricing, capabilities, and context
 * scraped from swiftrouter.com/models?plan=starter.
 *
 * Pricing: USD per 1M tokens (input / output).
 * Capabilities: text, vision, tools, code.
 * Context: token context window size.
 */

export interface ModelMeta {
	provider: string;
	capabilities: string[];
	context: number | null;
	maxTokens: number | null;
	priceIn: number | null;   // USD per 1M tokens
	priceOut: number | null;  // USD per 1M tokens
	displayName: string;
	isFree?: boolean;
}

/**
 * Master metadata map keyed by model ID.
 * Data sourced from SwiftRouter Starter plan catalog.
 */
export const MODEL_METADATA: Record<string, ModelMeta> = {
	// ─── Cohere ───────────────────────────────────────────────
	"command-a-03-2025": {
		provider: "Cohere",
		capabilities: ["text"],
		context: 256000,
		maxTokens: 8000,
		priceIn: 2.50,
		priceOut: 10.00,
		displayName: "Command A 03-2025",
	},
	"command-r-08-2024": {
		provider: "Cohere",
		capabilities: ["text", "tools"],
		context: 128000,
		maxTokens: 4000,
		priceIn: 0.15,
		priceOut: 0.60,
		displayName: "Command R 08-2024",
	},
	"command-r-plus-08-2024": {
		provider: "Cohere",
		capabilities: ["text", "tools"],
		context: 128000,
		maxTokens: 4000,
		priceIn: 2.50,
		priceOut: 10.00,
		displayName: "Command R Plus 08-2024",
	},
	"command-r7b-12-2024": {
		provider: "Cohere",
		capabilities: ["text"],
		context: 128000,
		maxTokens: 4000,
		priceIn: 0.04,
		priceOut: 0.15,
		displayName: "Command R7b 12-2024",
	},

	// ─── DeepSeek ─────────────────────────────────────────────
	"deepseek-r1-distill-qwen-32b": {
		provider: "DeepSeek",
		capabilities: ["text", "vision"],
		context: 33000,
		maxTokens: 33000,
		priceIn: 0.29,
		priceOut: 0.29,
		displayName: "DeepSeek R1 Distill Qwen 32B",
	},
	"deepseek-v3.1": {
		provider: "DeepSeek",
		capabilities: ["text", "vision", "tools"],
		context: 33000,
		maxTokens: 7000,
		priceIn: 0.15,
		priceOut: 0.75,
		displayName: "DeepSeek V3.1",
	},
	"deepseek-v3.2": {
		provider: "DeepSeek",
		capabilities: ["text", "vision", "tools"],
		context: 164000,
		maxTokens: 66000,
		priceIn: 0.25,
		priceOut: 0.40,
		displayName: "DeepSeek V3.2",
	},
	"deepseek-v4-flash": {
		provider: "DeepSeek",
		capabilities: ["text", "vision", "tools"],
		context: 1000000,
		maxTokens: 384000,
		priceIn: 0.14,
		priceOut: 0.28,
		displayName: "DeepSeek V4 Flash",
	},
	"deepseek-v4-pro": {
		provider: "DeepSeek",
		capabilities: ["text", "vision", "tools"],
		context: 164000,
		maxTokens: 66000,
		priceIn: 0.90,
		priceOut: 2.20,
		displayName: "DeepSeek V4 Pro",
	},

	// ─── Mistral ──────────────────────────────────────────────
	"devstral-2512": {
		provider: "Mistral",
		capabilities: ["text", "tools", "code"],
		context: 262000,
		maxTokens: null,
		priceIn: 0.40,
		priceOut: 2.00,
		displayName: "Devstral 2512",
	},
	"devstral-small-2512": {
		provider: "Mistral",
		capabilities: ["text", "tools"],
		context: 131000,
		maxTokens: null,
		priceIn: 0.10,
		priceOut: 0.30,
		displayName: "Devstral Small 2512",
	},
	"ministral-14b-2512": {
		provider: "Mistral",
		capabilities: ["text", "vision", "tools"],
		context: 262000,
		maxTokens: null,
		priceIn: 0.20,
		priceOut: 0.20,
		displayName: "Ministral 14B 2512",
	},
	"ministral-3b-2512": {
		provider: "Mistral",
		capabilities: ["text", "vision", "tools"],
		context: 131000,
		maxTokens: null,
		priceIn: 0.10,
		priceOut: 0.10,
		displayName: "Ministral 3B 2512",
	},
	"ministral-8b-2512": {
		provider: "Mistral",
		capabilities: ["text"],
		context: 262000,
		maxTokens: null,
		priceIn: 0.15,
		priceOut: 0.15,
		displayName: "Ministral 8B 2512",
	},
	"mistral-small-3.1-24b-instruct": {
		provider: "Mistral",
		capabilities: ["text", "vision"],
		context: 128000,
		maxTokens: null,
		priceIn: 0.35,
		priceOut: 0.56,
		displayName: "Mistral Small 3.1 24B Instruct",
	},
	"mixtral-8x22b-instruct": {
		provider: "Mistral",
		capabilities: ["text", "tools"],
		context: 66000,
		maxTokens: null,
		priceIn: 2.00,
		priceOut: 6.00,
		displayName: "Mixtral 8x22B Instruct",
	},
	"mixtral-8x7b-instruct": {
		provider: "Mistral",
		capabilities: ["text"],
		context: 33000,
		maxTokens: 16000,
		priceIn: 0.54,
		priceOut: 0.54,
		displayName: "Mixtral 8x7B Instruct",
	},

	// ─── Google ───────────────────────────────────────────────
	"gemma-3-4b-it": {
		provider: "Google",
		capabilities: ["text"],
		context: 131000,
		maxTokens: 16000,
		priceIn: 0.04,
		priceOut: 0.08,
		displayName: "Gemma 3 4B IT",
	},
	"gemma-3-12b-it": {
		provider: "Google",
		capabilities: ["text"],
		context: 131000,
		maxTokens: 16000,
		priceIn: 0.07,
		priceOut: 0.14,
		displayName: "Gemma 3 12B IT",
	},
	"gemma-3n-e2b-it": {
		provider: "Google",
		capabilities: ["text"],
		context: 8000,
		maxTokens: 2000,
		priceIn: 0.00,
		priceOut: 0.00,
		displayName: "Gemma 3N E2B IT",
		isFree: true,
	},
	"gemma-3n-e4b-it": {
		provider: "Google",
		capabilities: ["text"],
		context: 33000,
		maxTokens: null,
		priceIn: 0.02,
		priceOut: 0.04,
		displayName: "Gemma 3N E4B IT",
	},

	// ─── Zhipu (GLM) ─────────────────────────────────────────
	"glm-4.7-flash": {
		provider: "Zhipu",
		capabilities: ["text", "vision", "tools"],
		context: 203000,
		maxTokens: 16000,
		priceIn: 0.06,
		priceOut: 0.40,
		displayName: "GLM 4.7 Flash",
	},
	"glm-4.7": {
		provider: "Zhipu",
		capabilities: ["text", "vision", "tools"],
		context: 203000,
		maxTokens: 16000,
		priceIn: 0.10,
		priceOut: 0.40,
		displayName: "GLM 4.7",
	},
	"glm-5": {
		provider: "Zhipu",
		capabilities: ["text", "vision", "tools"],
		context: 203000,
		maxTokens: 16000,
		priceIn: 0.50,
		priceOut: 2.00,
		displayName: "GLM 5",
	},
	"glm-5.1": {
		provider: "Zhipu",
		capabilities: ["text", "vision", "tools"],
		context: 203000,
		maxTokens: 16000,
		priceIn: 1.00,
		priceOut: 4.00,
		displayName: "GLM 5.1",
	},

	// ─── OpenAI ───────────────────────────────────────────────
	"gpt-5.2": {
		provider: "OpenAI",
		capabilities: ["text", "vision", "tools"],
		context: 400000,
		maxTokens: 128000,
		priceIn: 1.75,
		priceOut: 14.00,
		displayName: "GPT 5.2",
	},
	"gpt-5.3-codex": {
		provider: "OpenAI",
		capabilities: ["text", "vision", "tools", "code"],
		context: 400000,
		maxTokens: 128000,
		priceIn: 1.75,
		priceOut: 14.00,
		displayName: "GPT 5.3 Codex",
	},
	"gpt-5.4": {
		provider: "OpenAI",
		capabilities: ["text", "vision", "tools"],
		context: 1100000,
		maxTokens: 128000,
		priceIn: 2.50,
		priceOut: 15.00,
		displayName: "GPT 5.4",
	},
	"gpt-5.4-mini": {
		provider: "OpenAI",
		capabilities: ["text", "vision", "tools"],
		context: 400000,
		maxTokens: 128000,
		priceIn: 0.75,
		priceOut: 4.50,
		displayName: "GPT 5.4 Mini",
	},
	"gpt-5.5": {
		provider: "OpenAI",
		capabilities: ["text", "vision", "tools"],
		context: 1000000,
		maxTokens: 128000,
		priceIn: 5.00,
		priceOut: 30.00,
		displayName: "GPT 5.5",
	},
	"gpt-image-2": {
		provider: "OpenAI",
		capabilities: ["image"],
		context: null,
		maxTokens: null,
		priceIn: 2.00,
		priceOut: 8.00,
		displayName: "GPT Image 2",
	},
	"gpt-oss-120b": {
		provider: "OpenAI",
		capabilities: ["text"],
		context: 131000,
		maxTokens: 131000,
		priceIn: 0.04,
		priceOut: 0.19,
		displayName: "GPT OSS 120B",
	},
	"gpt-oss-20b": {
		provider: "OpenAI",
		capabilities: ["text"],
		context: 131000,
		maxTokens: 131000,
		priceIn: 0.03,
		priceOut: 0.14,
		displayName: "GPT OSS 20B",
	},

	// ─── IBM ──────────────────────────────────────────────────
	"granite-4.0-h-micro": {
		provider: "IBM",
		capabilities: ["text"],
		context: 131000,
		maxTokens: null,
		priceIn: 0.02,
		priceOut: 0.11,
		displayName: "Granite 4.0 H Micro",
	},

	// ─── Meta ─────────────────────────────────────────────────
	"llama-3.2-1b-instruct": {
		provider: "Meta",
		capabilities: ["text"],
		context: 60000,
		maxTokens: null,
		priceIn: 0.03,
		priceOut: 0.20,
		displayName: "Llama 3.2 1B Instruct",
	},
	"llama-3.2-3b-instruct": {
		provider: "Meta",
		capabilities: ["text"],
		context: 131000,
		maxTokens: null,
		priceIn: 0.05,
		priceOut: 0.34,
		displayName: "Llama 3.2 3B Instruct",
	},
	"llama-4-scout": {
		provider: "Meta",
		capabilities: ["text", "vision", "tools"],
		context: 328000,
		maxTokens: 16000,
		priceIn: 0.08,
		priceOut: 0.30,
		displayName: "Llama 4 Scout",
	},
	"llama-guard-3-8b": {
		provider: "Meta",
		capabilities: ["text"],
		context: 131000,
		maxTokens: null,
		priceIn: 0.02,
		priceOut: 0.06,
		displayName: "Llama Guard 3 8B",
	},

	// ─── MiniMax ──────────────────────────────────────────────
	"minimax-m2": {
		provider: "MiniMax",
		capabilities: ["text", "vision", "tools"],
		context: 197000,
		maxTokens: 197000,
		priceIn: 0.26,
		priceOut: 1.00,
		displayName: "MiniMax M2",
	},
	"minimax-m2.1": {
		provider: "MiniMax",
		capabilities: ["text", "vision", "tools"],
		context: 197000,
		maxTokens: 197000,
		priceIn: 0.27,
		priceOut: 0.95,
		displayName: "MiniMax M2.1",
	},
	"minimax-m2.5": {
		provider: "MiniMax",
		capabilities: ["text", "vision", "tools"],
		context: 197000,
		maxTokens: 197000,
		priceIn: 0.28,
		priceOut: 1.10,
		displayName: "MiniMax M2.5",
	},
	"minimax-m2.7": {
		provider: "MiniMax",
		capabilities: ["text", "vision", "tools"],
		context: 205000,
		maxTokens: null,
		priceIn: 0.30,
		priceOut: 1.20,
		displayName: "MiniMax M2.7",
	},

	// ─── NVIDIA ───────────────────────────────────────────────
	"nemotron-3-nano-30b-a3b": {
		provider: "NVIDIA",
		capabilities: ["text", "vision", "tools"],
		context: 262000,
		maxTokens: 228000,
		priceIn: 0.05,
		priceOut: 0.20,
		displayName: "Nemotron 3 Nano 30B A3B",
	},
	"nemotron-nano-12b-v2-vl": {
		provider: "NVIDIA",
		capabilities: ["text", "vision"],
		context: 131000,
		maxTokens: 16000,
		priceIn: 0.20,
		priceOut: 0.60,
		displayName: "Nemotron Nano 12B V2 VL",
	},
	"nemotron-nano-9b-v2": {
		provider: "NVIDIA",
		capabilities: ["text", "vision", "tools"],
		context: 131000,
		maxTokens: 16000,
		priceIn: 0.04,
		priceOut: 0.16,
		displayName: "Nemotron Nano 9B V2",
	},

	// ─── Qwen ─────────────────────────────────────────────────
	"qwen3-30b-a3b": {
		provider: "Qwen",
		capabilities: ["text", "vision", "tools"],
		context: 41000,
		maxTokens: 16000,
		priceIn: 0.08,
		priceOut: 0.28,
		displayName: "Qwen3 30B A3B",
	},
	"qwen3.6-plus": {
		provider: "Qwen",
		capabilities: ["text", "vision", "tools"],
		context: 131000,
		maxTokens: 8000,
		priceIn: 0.40,
		priceOut: 1.20,
		displayName: "Qwen 3.6 Plus",
	},
	"qwen3-coder-480b": {
		provider: "Qwen",
		capabilities: ["text", "tools"],
		context: 262000,
		maxTokens: 66000,
		priceIn: 0.22,
		priceOut: 1.00,
		displayName: "Qwen3 Coder 480B",
	},
	"qwen3-coder-next": {
		provider: "Qwen",
		capabilities: ["text", "tools"],
		context: 262000,
		maxTokens: 262000,
		priceIn: 0.12,
		priceOut: 0.75,
		displayName: "Qwen3 Coder Next",
	},
	"qwen3-vl-235b-instruct": {
		provider: "Qwen",
		capabilities: ["text", "vision", "tools"],
		context: 262000,
		maxTokens: 16000,
		priceIn: 0.20,
		priceOut: 0.88,
		displayName: "Qwen3 VL 235B Instruct",
	},
	"qwen3-vl-235b-thinking": {
		provider: "Qwen",
		capabilities: ["text", "vision", "tools"],
		context: 131000,
		maxTokens: 33000,
		priceIn: 0.00,
		priceOut: 0.00,
		displayName: "Qwen3 VL 235B Thinking",
		isFree: true,
	},
	"qwq-32b": {
		provider: "Qwen",
		capabilities: ["text", "vision", "tools"],
		context: 33000,
		maxTokens: 131000,
		priceIn: 0.15,
		priceOut: 0.40,
		displayName: "QwQ 32B",
	},

	// ─── Moonshot (Kimi) ──────────────────────────────────────
	"kimi-k2.5": {
		provider: "Moonshot",
		capabilities: ["text", "tools"],
		context: 131000,
		maxTokens: 8000,
		priceIn: 0.30,
		priceOut: 1.20,
		displayName: "Kimi K2.5",
	},
	"kimi-k2.6": {
		provider: "Moonshot",
		capabilities: ["text", "tools"],
		context: 131000,
		maxTokens: 8000,
		priceIn: 0.60,
		priceOut: 2.40,
		displayName: "Kimi K2.6",
	},

	// ─── Essential AI ─────────────────────────────────────────
	"rnj-1-8b": {
		provider: "EssentialAI",
		capabilities: ["text", "tools"],
		context: 33000,
		maxTokens: null,
		priceIn: 0.15,
		priceOut: 0.15,
		displayName: "RNJ-1 8B",
	},
};

/**
 * Enrich a basic SwiftRouter model entry with our static metadata.
 */
export function enrichModel(modelId: string, ownedBy?: string) {
	const meta = MODEL_METADATA[modelId];
	if (meta) {
		return {
			provider: meta.provider,
			displayName: meta.displayName,
			capabilities: meta.capabilities,
			context: meta.context ? String(meta.context) : null,
			maxTokens: meta.maxTokens ? String(meta.maxTokens) : null,
			priceIn: meta.priceIn !== null ? String(meta.priceIn) : null,
			priceOut: meta.priceOut !== null ? String(meta.priceOut) : null,
			isFree: meta.isFree || false,
		};
	}
	// Fallback: capitalize owned_by as provider name
	const fallbackProvider = ownedBy
		? ownedBy.charAt(0).toUpperCase() + ownedBy.slice(1)
		: "Unknown";
	return {
		provider: fallbackProvider,
		displayName: modelId,
		capabilities: ["text"],
		context: null,
		maxTokens: null,
		priceIn: null,
		priceOut: null,
		isFree: false,
	};
}
