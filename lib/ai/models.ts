export const DEFAULT_CHAT_MODEL = "groq/llama-3.3-70b-versatile";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "groq/llama-3.3-70b-versatile",
    name: "UltraAgent",
    provider: "groq",
    description: "Advanced AI with superior reasoning and coding capabilities",
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
