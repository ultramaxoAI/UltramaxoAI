import { groq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const getLanguageModel = (modelId: string) => {
  const normalized = modelId.toLowerCase();

  console.log("[AI Provider] Getting language model:", { modelId, normalized });

  try {
    if (normalized.includes("llama-3.1-8b")) {
      console.log("[AI Provider] Using Groq Llama 3.1 8B Instant");
      return groq("llama-3.1-8b-instant");
    }

    if (normalized.includes("llama-3.1-70b")) {
      console.log("[AI Provider] Using Groq Llama 3.1 70B Versatile");
      return groq("llama-3.1-70b-versatile");
    }

    if (normalized.startsWith("groq/")) {
      console.log("[AI Provider] Using Groq default (Llama 3.1 70B)");
      return groq("llama-3.1-70b-versatile");
    }

    console.log("[AI Provider] Using fallback model (Llama 3.1 70B)");
    return groq("llama-3.1-70b-versatile");
  } catch (error) {
    console.error("[AI Provider] Error creating model:", error);
    throw error;
  }
};

export function getTitleModel() {
  return groq("llama-3.1-8b-instant");
}

export function getArtifactModel() {
  return groq("llama-3.1-70b-versatile");
}
