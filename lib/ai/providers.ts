import { createGroq, groq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

// Groq client setup
type GroqProvider = typeof groq;

const primaryApiKey = (
  process.env.GROQ_API_KEY_1 ||
  process.env.GROQ_API_KEY ||
  ""
).trim();
const secondaryApiKey = (
  process.env.GROQ_API_KEY_2 ||
  process.env.GROQ_API_KEY_3 ||
  ""
).trim();

const groqPrimary: GroqProvider =
  primaryApiKey && primaryApiKey.length > 0
    ? createGroq({ apiKey: primaryApiKey })
    : groq;

const groqSecondary: GroqProvider | null =
  secondaryApiKey && secondaryApiKey.length > 0
    ? createGroq({ apiKey: secondaryApiKey })
    : null;

// Local AI setup
const localAiUrl = process.env.LOCAL_AI_URL || "http://localhost:8000/v1";
console.log("[AI Provider] Initializing localClient with baseURL:", localAiUrl);

const localClient = createOpenAI({
  baseURL: localAiUrl,
  apiKey: "not-needed",
});

let usePrimaryNext = true;
let lastFailedKey: "primary" | "secondary" | null = null;

function getGroqClient(): GroqProvider {
  const hasPrimaryEnv = primaryApiKey && primaryApiKey.length > 0;
  const hasSecondaryEnv = secondaryApiKey && secondaryApiKey.length > 0;

  if (!hasPrimaryEnv && !hasSecondaryEnv) {
    throw new Error(
      "GROQ_API_KEY or GROQ_API_KEY_1/2 is not configured properly."
    );
  }

  if (lastFailedKey === "primary" && groqSecondary) {
    return groqSecondary as any;
  }
  if (lastFailedKey === "secondary" && hasPrimaryEnv) {
    return groqPrimary;
  }

  if (groqSecondary && hasSecondaryEnv) {
    const usePrimary = usePrimaryNext;
    usePrimaryNext = !usePrimaryNext;
    return usePrimary ? groqPrimary : (groqSecondary as any);
  }

  return groqPrimary;
}

export function markKeyFailed(keyType: "primary" | "secondary") {
  lastFailedKey = keyType;
}

export function resetFailureTracking() {
  lastFailedKey = null;
}

export const getLanguageModel = (modelId: string) => {
  const normalized = modelId.toLowerCase();

  console.log("-----------------------------------------");
  console.log("[AI Provider] Model Requested:", modelId);
  console.log("[AI Provider] Routing to Singapore VPS...");

  const getLocalChatModel = (id: string) => {
    // Calling .chat() explicitly forces OpenAIChatLanguageModel (uses /chat/completions)
    // instead of OpenAIResponsesLanguageModel (uses /v1/responses)
    const client = localClient as any;
    return typeof client.chat === "function"
      ? client.chat(id)
      : localClient(id);
  };

  // Handle Ultramaxo Local Models & Legacy IDs
  if (
    normalized.startsWith("ultramaxo/") ||
    normalized.includes("llama") ||
    normalized.includes("deepseek") ||
    normalized.startsWith("local/")
  ) {
    console.log("[AI Provider] ACTION: Using Local Chat API");
    return getLocalChatModel("gpt-3.5-turbo");
  }

  const groqClient = getGroqClient();

  try {
    if (normalized.startsWith("groq/")) {
      const actualModelId = modelId.split("/")[1];
      console.log("[AI Provider] ACTION: Using Groq Cloud for", actualModelId);
      return groqClient(actualModelId);
    }

    // Default fallback to Local AI
    console.log("[AI Provider] ACTION: Default Fallback to Singapore");
    return getLocalChatModel("gpt-3.5-turbo");
  } catch (error) {
    console.error("[AI Provider] ERROR Routing:", error);
    return getLocalChatModel("gpt-3.5-turbo");
  }
};

export function getTitleModel() {
  console.log("[AI Provider] Title generation -> Singapore");
  const client = localClient as any;
  return typeof client.chat === "function"
    ? client.chat("gpt-3.5-turbo")
    : localClient("gpt-3.5-turbo");
}

export function getArtifactModel() {
  console.log("[AI Provider] Artifact generation -> Singapore");
  const client = localClient as any;
  return typeof client.chat === "function"
    ? client.chat("gpt-3.5-turbo")
    : localClient("gpt-3.5-turbo");
}
