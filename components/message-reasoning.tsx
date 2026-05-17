"use client";

import { ThinkingIndicator } from "@/components/ThinkingIndicator";
import {
	AgentThinkingPanel,
	type AgentThinkingStep,
} from "./agent-thinking-panel";

export { AgentThinkingPanel, type AgentThinkingStep };

function toReasoningChunks(reasoning: string) {
	const normalized = reasoning
		.replace(/\r\n/g, "\n")
		.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");

	return normalized.trim() ? [normalized] : [];
}

export function MessageReasoning({
	isLoading,
	reasoning,
}: {
	isLoading: boolean;
	reasoning: string;
}) {
	if (!isLoading) return null;

	return (
		<ThinkingIndicator
			isActive={isLoading}
			thinkingChunks={toReasoningChunks(reasoning)}
		/>
	);
}
