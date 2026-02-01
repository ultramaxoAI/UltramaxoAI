import { groq } from "@ai-sdk/groq";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const getLanguageModel = (modelId: string) => {
  const normalized = modelId.toLowerCase();

  if (normalized.includes("llama-3.1-8b")) {
    return groq("llama-3.1-8b-instant");
  }

  if (normalized.includes("llama-3.1-70b")) {
    return groq("llama-3.1-70b-versatile");
  }

  if (normalized.startsWith("groq/")) {
    return groq("llama-3.1-70b-versatile");
  }

  return groq("llama-3.1-70b-versatile");
};

export function getTitleModel() {
  return groq("llama-3.1-8b-instant");
}

export function getArtifactModel() {
  return groq("llama-3.1-70b-versatile");
}
