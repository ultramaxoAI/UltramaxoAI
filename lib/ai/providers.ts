import { createOpenAI } from "@ai-sdk/openai";

// ============================================================
// MAIA Router API Keys
// ============================================================
const maiaApiKey = (process.env.OPENROUTER_API_KEY_1 || "").trim();

/**
 * Creates a model via @ai-sdk/openai pointing to MAIA Router.
 * Uses .chat() to ensure /chat/completions endpoint is used.
 */
function getMaiaRouterModel(modelId: string) {
  if (!maiaApiKey) {
    throw new Error(
      "No MAIA Router API key configured. Set OPENROUTER_API_KEY_1 in your environment."
    );
  }

  console.log(`[AI Provider] Creating MAIA Router model: ${modelId}`);

  const client = createOpenAI({
    baseURL: "https://api.maiarouter.ai/v1", // MAIA Router Endpoint
    apiKey: maiaApiKey,
    headers: {
      "HTTP-Referer": "https://ultramaxo.com",
      "X-Title": "Ultramaxo AI",
    },
  });

  // Use .chat() for Chat Completions endpoint
  return client.chat(modelId);
}

// ============================================================
// Model IDs on MAIA Router (xAI Grok & Gemini)
// ============================================================
// Primary Model: xAI Grok 4-1 Fast (Supports Vision, Tools, Reasoning)
// Update: Preview model erroring (503), reverting to stable Flash
const GROK_MODEL = "maia/gemini-2.5-flash";

// ============================================================
// getLanguageModel - main routing function
// ============================================================
export const getLanguageModel = (modelId: string) => {
  const normalized = modelId.toLowerCase();
  console.log("-------------------------------------------");
  console.log("[AI Provider] Model Requested:", modelId);

  // All "ultra-agent" variants map to Grok (now Gemini Flash Preview)
  if (normalized.includes("ultra-agent") || normalized.includes("pro")) {
    console.log("[AI Provider] -> UltraAgent (Grok/Gemini):", GROK_MODEL);
    return getMaiaRouterModel(GROK_MODEL);
  }

  // Explicit maia/ or xai/ prefix
  if (normalized.startsWith("maia/") || normalized.startsWith("xai/")) {
    console.log("[AI Provider] -> Passthrough:", modelId);
    return getMaiaRouterModel(modelId);
  }

  // Default fallback
  console.log("[AI Provider] -> Default:", GROK_MODEL);
  return getMaiaRouterModel(GROK_MODEL);
};

// ============================================================
// Title generation
// ============================================================
export function getTitleModel() {
  console.log("[AI Provider] Title model:", GROK_MODEL);
  return getMaiaRouterModel(GROK_MODEL);
}

// ============================================================
// Artifact model
// ============================================================
export function getArtifactModel() {
  console.log("[AI Provider] Artifact model:", GROK_MODEL);
  return getMaiaRouterModel(GROK_MODEL);
}

// ============================================================
// Image/Vision model
// ============================================================
export function getImageModel() {
  console.log("[AI Provider] Vision model:", GROK_MODEL);
  return getMaiaRouterModel(GROK_MODEL);
}
