import { groq, createGroq } from "@ai-sdk/groq";

// Groq client setup with support for multiple API keys and automatic fallback.
// If GROQ_API_KEY_1 fails (rate limit/error), automatically switches to GROQ_API_KEY_2
// Priority order: GROQ_API_KEY_1 → GROQ_API_KEY_2 → GROQ_API_KEY

type GroqProvider = typeof groq;

// Validate and clean API keys (remove empty strings)
const primaryApiKey = (process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY || '').trim();
const secondaryApiKey = (process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_3 || '').trim();

// Only create clients if we have valid non-empty keys
const groqPrimary: GroqProvider = primaryApiKey && primaryApiKey.length > 0
  ? createGroq({ apiKey: primaryApiKey })
  : groq;

const groqSecondary: GroqProvider | null = secondaryApiKey && secondaryApiKey.length > 0
  ? createGroq({ apiKey: secondaryApiKey })
  : null;

let usePrimaryNext = true;
let lastFailedKey: 'primary' | 'secondary' | null = null;

function getGroqClient(): GroqProvider {
  // Check for non-empty API keys
  const hasPrimaryEnv = primaryApiKey && primaryApiKey.length > 0;
  const hasSecondaryEnv = secondaryApiKey && secondaryApiKey.length > 0;

  if (!hasPrimaryEnv && !hasSecondaryEnv) {
    console.error("[AI Provider] CRITICAL: No valid Groq API key found");
    console.error("[AI Provider] Primary key:", primaryApiKey ? 'exists but empty' : 'not set');
    console.error("[AI Provider] Secondary key:", secondaryApiKey ? 'exists but empty' : 'not set');
    throw new Error(
      "GROQ_API_KEY or GROQ_API_KEY_1/2 is not configured properly. Please add it to environment variables.",
    );
  }

  // If last request failed on one key, prefer the other
  if (lastFailedKey === 'primary' && groqSecondary) {
    console.log("[AI Provider] Using secondary key (primary failed last time)");
    return groqSecondary;
  }
  
  if (lastFailedKey === 'secondary' && hasPrimaryEnv) {
    console.log("[AI Provider] Using primary key (secondary failed last time)");
    return groqPrimary;
  }

  // If we have both keys configured, alternate between them.
  if (groqSecondary && hasSecondaryEnv) {
    const usePrimary = usePrimaryNext;
    usePrimaryNext = !usePrimaryNext;
    const client = usePrimary ? groqPrimary : groqSecondary;
    console.log("[AI Provider] Using Groq client:", usePrimary ? "primary" : "secondary");
    return client;
  }

  console.log("[AI Provider] Using Groq client: primary-only");
  return groqPrimary;
}

// Mark a key as failed for fallback logic
export function markKeyFailed(keyType: 'primary' | 'secondary') {
  lastFailedKey = keyType;
  console.log(`[AI Provider] Marked ${keyType} key as failed, will prefer other key`);
}

// Reset failure tracking
export function resetFailureTracking() {
  lastFailedKey = null;
  console.log("[AI Provider] Reset failure tracking");
}

export const getLanguageModel = (modelId: string) => {
  const normalized = modelId.toLowerCase();

  console.log("[AI Provider] Getting language model:", { modelId, normalized });

  const groqClient = getGroqClient();

  try {
    if (normalized.includes("llama-3.3-70b")) {
      console.log("[AI Provider] Using Groq Llama 3.3 70B (UltraAgent)");
      return groqClient("llama-3.3-70b-versatile");
    }

    if (normalized.startsWith("groq/")) {
      console.log("[AI Provider] Using Groq default (Llama 3.3 70B)");
      return groqClient("llama-3.3-70b-versatile");
    }

    console.log("[AI Provider] Using fallback model (Llama 3.3 70B)");
    return groqClient("llama-3.3-70b-versatile");
  } catch (error) {
    console.error("[AI Provider] Error creating model:", error);
    throw error;
  }
};

export function getTitleModel() {
  const groqClient = getGroqClient();
  return groqClient("llama-3.3-70b-versatile");
}

export function getArtifactModel() {
  const groqClient = getGroqClient();
  // Use Llama 3.3 70B - same as main chat model
  // We'll use streamText instead of streamObject to avoid json_schema requirement
  return groqClient("llama-3.3-70b-versatile");
}
