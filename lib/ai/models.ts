export const DEFAULT_CHAT_MODEL = "groq/ultraagent-deepseek";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "groq/wormgpt-deepseek",
    name: "WormGPT",
    provider: "groq",
    description: "Specialized model for flexible and creative tasks",
  },
  {
    id: "groq/ultraagent-deepseek",
    name: "UltraAgent",
    provider: "groq",
    description: "The most powerful agentive model for complex logic",
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
