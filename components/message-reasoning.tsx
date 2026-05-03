"use client";

import {
	AgentThinkingPanel,
	type AgentThinkingStep,
} from "./agent-thinking-panel";

export { AgentThinkingPanel, type AgentThinkingStep };

export function MessageReasoning({
	isLoading,
	reasoning,
}: {
	isLoading: boolean;
	reasoning: string;
}) {
	const steps: AgentThinkingStep[] = reasoning
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 6)
		.map((line, index) => ({
			id: `reasoning-${index}`,
			type: "thought",
			label: line.replace(/^[-*>]\s*/, ""),
			status:
				isLoading && index === 0 ? ("running" as const) : ("done" as const),
		}));

	return (
		<AgentThinkingPanel
			status={isLoading ? "thinking" : "done"}
			steps={steps}
		/>
	);
}
