export const DEFAULT_CHAT_MODEL = "ultramaxo/ultra-agent";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "ultramaxo/ultra-agent",
    name: "UltraAgent",
    provider: "ultramaxo",
    description: "Fast and capable AI assistant powered by Qwen3 80B",
  },
  {
    id: "ultramaxo/ultra-agent-pro",
    name: "UltraAgent Pro",
    provider: "ultramaxo",
    description:
      "Advanced AI with superior reasoning, deep thinking, and expert-level coding powered by Qwen3 Coder 480B",
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
