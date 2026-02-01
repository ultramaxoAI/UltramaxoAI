export const DEFAULT_CHAT_MODEL = "groq/llama-3.1-70b-versatile";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "groq/llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Fast response model for everyday tasks",
  },
  {
    id: "groq/llama-3.1-70b-versatile",
    name: "Llama 3.1 70B Versatile",
    provider: "groq",
    description: "Stronger reasoning and coding performance",
  },
];

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
