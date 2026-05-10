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

function toReasoningLabel(reasoning: string) {
	const cleaned = reasoning
		.replace(/\*\*([\s\S]+?)\*\*/g, "$1")
		.replace(/\s+/g, " ")
		.trim();

	if (!cleaned) {
		return undefined;
	}

	return cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
}

export function MessageReasoning({
	isLoading,
	reasoning,
}: {
	isLoading: boolean;
	reasoning: string;
}) {
	return (
		<ThinkingIndicator
			agentLabel={toReasoningLabel(reasoning)}
			isActive={isLoading}
			thinkingChunks={toReasoningChunks(reasoning)}
		/>
	);
}
