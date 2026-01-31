import { groq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const getLanguageModel = (modelId: string) => {
  // Use DeepSeek R1 Distill Llama 70B for both models
  const groqModelId = "deepseek-r1-distill-llama-70b";

  if (modelId.includes("wormgpt")) {
    // We can add specific system behavior or different parameters for WormGPT here if needed
    return groq(groqModelId);
  }

  if (modelId.includes("ultraagent")) {
    return groq(groqModelId);
  }

  // Fallback for other potential IDs (like the original ones if still being used somewhere)
  if (modelId.startsWith("groq/")) {
      return groq(groqModelId);
  }

  // Default fallback to Groq/DeepSeek
  return groq(groqModelId);
};

export function getTitleModel() {
  return groq("deepseek-r1-distill-llama-70b");
}

export function getArtifactModel() {
  return groq("deepseek-r1-distill-llama-70b");
}
