export const DEFAULT_CHAT_MODEL = "ultramaxo/ultra-agent";

export type ChatModel = {
	id: string;
	name: string;
	provider: string;
	description: string;
	isPro?: boolean;
};

export const chatModels: ChatModel[] = [
	{
		id: "ultramaxo/ultra-agent",
		name: "UltraAgent",
		provider: "ultramaxo",
		description: "Fast and capable AI assistant powered by MiniMax-M2.7-highspeed",
	},
	{
		id: "ultramaxo/ultra-agent-pro",
		name: "UltraAgent Pro",
		provider: "ultramaxo",
		description:
			"Advanced AI with superior reasoning, deep thinking, and expert-level coding powered by Kimi K2.6",
		isPro: true,
	},
	{
		id: "openai/gpt-5.4-mini",
		name: "GPT-5.4 Mini",
		provider: "openai",
		description: "Powerful task execution for IDE mode and deep reasoning.",
		isPro: true,
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
	{} as Record<string, ChatModel[]>,
);
